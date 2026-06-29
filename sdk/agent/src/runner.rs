use std::io::BufRead;
use std::time::{SystemTime, UNIX_EPOCH};

use anyhow::{Context, Result};
use sha2::{Digest, Sha256};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{read_keypair_file, Keypair},
    signer::Signer,
    sysvar::slot_hashes,
    transaction::Transaction,
};

use crate::inference::{categorize, InferenceResult};
use crate::{AgentMemory, InferenceRequest, SmartAgent};

const PROGRAM_ID: &str = "5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT";
const DEVNET_RPC: &str = "https://api.devnet.solana.com";
const TESTNET_RPC: &str = "https://api.testnet.solana.com";
const DEFAULT_STAKE: u64 = 100_000_000;

fn anchor_disc(name: &str) -> [u8; 8] {
    let hash = Sha256::digest(format!("global:{name}").as_bytes());
    hash[..8].try_into().unwrap()
}

fn find_pda(seeds: &[&[u8]], program_id: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(seeds, program_id).0
}

fn hash_bytes(input: &[u8]) -> [u8; 32] {
    Sha256::digest(input).into()
}

pub struct AgentRunner<A: SmartAgent> {
    agent: A,
    rpc_url: String,
    wallet_path: String,
}

impl<A: SmartAgent> AgentRunner<A> {
    pub fn new(agent: A) -> Self {
        Self {
            agent,
            rpc_url: DEVNET_RPC.to_owned(),
            wallet_path: default_wallet_path(),
        }
    }

    pub fn with_devnet(mut self) -> Self {
        self.rpc_url = DEVNET_RPC.to_owned();
        self
    }

    pub fn with_testnet(mut self) -> Self {
        self.rpc_url = TESTNET_RPC.to_owned();
        self
    }

    pub fn with_endpoint(mut self, endpoint: impl Into<String>) -> Self {
        self.rpc_url = endpoint.into();
        self
    }

    pub fn with_wallet(mut self, path: impl Into<String>) -> Self {
        self.wallet_path = path.into();
        self
    }

    pub async fn run(self) -> Result<()> {
        let wallet = read_keypair_file(&self.wallet_path)
            .map_err(|e| anyhow::anyhow!("Failed to read wallet at {}: {e}", self.wallet_path))?;
        let rpc = RpcClient::new_with_commitment(self.rpc_url.clone(), CommitmentConfig::confirmed());
        let program_id: Pubkey = PROGRAM_ID.parse()?;

        println!("[RAXION SDK] Agent: {}", self.agent.name());
        println!("[RAXION SDK] Architecture: {}", self.agent.architecture_type());
        println!("[RAXION SDK] RPC: {}", self.rpc_url);
        println!("[RAXION SDK] Wallet: {}", wallet.pubkey());

        ensure_agent_initialized(&rpc, &wallet, &program_id)?;

        let mut memory = AgentMemory::new(wallet.pubkey().to_string());

        let queries: Vec<String> = if std::io::IsTerminal::is_terminal(&std::io::stdin()) {
            // ponytail: no stdin pipe, use default test queries
            vec![
                "What is 2+2?".into(),
                "Explain the Pythagorean theorem".into(),
                "Is P=NP?".into(),
            ]
        } else {
            std::io::stdin().lock().lines().filter_map(|l| l.ok()).filter(|l| !l.trim().is_empty()).collect()
        };

        println!("[RAXION SDK] Processing {} queries\n", queries.len());

        for (i, query) in queries.iter().enumerate() {
            let inference_id = now_micros() + i as u64;
            let request = InferenceRequest {
                query: query.clone(),
                inference_id,
                context: None,
            };

            let response = match self.agent.respond(&request, &memory).await {
                Ok(r) => r,
                Err(e) => {
                    eprintln!("[{}/{}] Agent error: {e}", i + 1, queries.len());
                    continue;
                }
            };

            // ponytail: mock coherence score for devnet, real score comes from convergence of 3 architectures
            let coherence_score = mock_score(i);
            let proof_hash = hash_bytes(response.as_bytes());
            let output_hash_t = hash_bytes(format!("T:{response}").as_bytes());
            let output_hash_s = hash_bytes(format!("S:{response}").as_bytes());

            let result = submit_convergence(
                &rpc, &wallet, &program_id,
                inference_id, coherence_score,
                proof_hash, output_hash_t, output_hash_s,
            );

            let tx_sig = match result {
                Ok(sig) => {
                    memory.inference_count += 1;
                    let _ = memory.store(&query, &response).await;
                    Some(sig.to_string())
                }
                Err(e) => {
                    eprintln!("[{}/{}] Submit error: {e}", i + 1, queries.len());
                    None
                }
            };

            let cat = categorize(coherence_score);
            let ir = InferenceResult {
                inference_id,
                response: response.chars().take(80).collect(),
                coherence_score,
                category: cat,
                is_final: coherence_score >= 0.60,
                tx_signature: tx_sig.clone(),
            };

            println!(
                "[{}/{}] score={:.3} cat={} tx={}",
                i + 1,
                queries.len(),
                ir.coherence_score,
                ir.category,
                tx_sig.as_deref().map(|s| &s[..20.min(s.len())]).unwrap_or("FAILED"),
            );
        }

        println!("\n[RAXION SDK] Done. {} inferences submitted.", memory.inference_count);
        Ok(())
    }
}

fn ensure_agent_initialized(rpc: &RpcClient, wallet: &Keypair, program_id: &Pubkey) -> Result<()> {
    let stake_pda = find_pda(&[b"stake", wallet.pubkey().as_ref()], program_id);

    if rpc.get_account(&stake_pda).is_ok() {
        println!("[RAXION SDK] Agent already initialized on-chain");
        return Ok(());
    }

    println!("[RAXION SDK] Initializing agent on-chain...");
    let cognitive_pda = find_pda(&[b"cognitive", wallet.pubkey().as_ref()], program_id);

    let mut data = Vec::with_capacity(16);
    data.extend_from_slice(&anchor_disc("init_agent"));
    data.extend_from_slice(&DEFAULT_STAKE.to_le_bytes());

    let ix = Instruction::new_with_bytes(
        *program_id,
        &data,
        vec![
            AccountMeta::new(wallet.pubkey(), true),
            AccountMeta::new(stake_pda, false),
            AccountMeta::new(cognitive_pda, false),
            AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
        ],
    );

    let blockhash = rpc.get_latest_blockhash()?;
    let tx = Transaction::new_signed_with_payer(&[ix], Some(&wallet.pubkey()), &[wallet], blockhash);
    let sig = rpc.send_and_confirm_transaction(&tx)
        .context("init_agent transaction failed")?;
    println!("[RAXION SDK] Agent initialized: {sig}");
    Ok(())
}

fn submit_convergence(
    rpc: &RpcClient,
    wallet: &Keypair,
    program_id: &Pubkey,
    inference_id: u64,
    coherence_score: f32,
    proof_hash: [u8; 32],
    output_hash_t: [u8; 32],
    output_hash_s: [u8; 32],
) -> Result<solana_sdk::signature::Signature> {
    let stake_pda = find_pda(&[b"stake", wallet.pubkey().as_ref()], program_id);
    let cognitive_pda = find_pda(&[b"cognitive", wallet.pubkey().as_ref()], program_id);
    let inference_pda = find_pda(
        &[b"inference", wallet.pubkey().as_ref(), &inference_id.to_le_bytes()],
        program_id,
    );

    let mut data = Vec::with_capacity(8 + 8 + 4 + 32 + 32 + 32);
    data.extend_from_slice(&anchor_disc("submit_convergence"));
    data.extend_from_slice(&inference_id.to_le_bytes());
    data.extend_from_slice(&coherence_score.to_le_bytes());
    data.extend_from_slice(&proof_hash);
    data.extend_from_slice(&output_hash_t);
    data.extend_from_slice(&output_hash_s);

    let ix = Instruction::new_with_bytes(
        *program_id,
        &data,
        vec![
            AccountMeta::new(wallet.pubkey(), true),
            AccountMeta::new_readonly(stake_pda, false),
            AccountMeta::new_readonly(cognitive_pda, false),
            AccountMeta::new_readonly(slot_hashes::id(), false),
            AccountMeta::new(inference_pda, false),
            AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
        ],
    );

    let blockhash = rpc.get_latest_blockhash()?;
    let tx = Transaction::new_signed_with_payer(&[ix], Some(&wallet.pubkey()), &[wallet], blockhash);
    rpc.send_and_confirm_transaction(&tx).context("submit_convergence failed")
}

fn default_wallet_path() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/root".into());
    format!("{home}/.config/solana/id.json")
}

fn now_micros() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_micros() as u64
}

// ponytail: mock score spread across categories, real score from 3-architecture convergence
fn mock_score(index: usize) -> f32 {
    let base = [0.15, 0.45, 0.72, 0.91, 0.55, 0.68, 0.33, 0.87, 0.62, 0.41];
    base[index % base.len()]
}

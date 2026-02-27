use std::collections::BTreeMap;
use std::env;
use std::fs;
use std::path::PathBuf;
use std::rc::Rc;

use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signature::{read_keypair_file, Keypair, Signature, Signer};
use anchor_client::{Client, Cluster, Program};
use anyhow::{anyhow, Context, Result};
use serde::Serialize;
use sha2::{Digest, Sha256};

const DEFAULT_PROGRAM_ID: &str = "5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT";
const DEFAULT_OUT: &str = "docs/reports/network-loadgen-report.json";

#[derive(Debug, Clone)]
struct Config {
    cluster: String,
    rpc_url: Option<String>,
    program_id: Pubkey,
    wallet_path: PathBuf,
    agents: u64,
    queries: u64,
    stake_amount: u64,
    low_score_every: u64,
    challenge_fail_every: u64,
    out_path: PathBuf,
}

#[derive(Debug)]
struct AgentState {
    keypair: Keypair,
    inference_seq: u64,
    submitted: u64,
}

#[derive(Debug, Serialize)]
struct Report {
    cluster: String,
    rpc_url: Option<String>,
    program_id: String,
    queries_total: u64,
    agents_total: u64,
    avg_coherence_score: f64,
    queries_below_reject_threshold: u64,
    challenged_queries: u64,
    challenge_failures_submitted: u64,
    slash_trigger1_expected: u64,
    slash_trigger2_expected: u64,
    tx_signatures_sample: Vec<String>,
    per_agent_queries: BTreeMap<String, u64>,
}

fn main() -> Result<()> {
    let cfg = Config::from_env()?;
    run(cfg)
}

impl Config {
    fn from_env() -> Result<Self> {
        let cluster = env::var("RAXION_CLUSTER").unwrap_or_else(|_| "devnet".to_owned());
        let rpc_url = env::var("RAXION_RPC_URL").ok();
        let program_id = env::var("RAXION_POIQ_PROGRAM_ID")
            .unwrap_or_else(|_| DEFAULT_PROGRAM_ID.to_owned())
            .parse::<Pubkey>()
            .context("invalid RAXION_POIQ_PROGRAM_ID")?;
        let wallet_path = env::var("ANCHOR_WALLET")
            .map(PathBuf::from)
            .or_else(|_| env::var("SOLANA_WALLET").map(PathBuf::from))
            .unwrap_or_else(|_| {
                let home = env::var("HOME").unwrap_or_else(|_| ".".to_owned());
                PathBuf::from(home).join(".config/solana/id.json")
            });

        let agents = parse_env_u64("RAXION_LOADGEN_AGENTS", 10)?;
        let queries = parse_env_u64("RAXION_LOADGEN_QUERIES", 1000)?;
        let stake_amount = parse_env_u64("RAXION_LOADGEN_STAKE", 1_000_000)?;
        let low_score_every = parse_env_u64("RAXION_LOADGEN_LOW_SCORE_EVERY", 50)?;
        let challenge_fail_every = parse_env_u64("RAXION_LOADGEN_CHALLENGE_FAIL_EVERY", 5)?;
        let out_path = PathBuf::from(
            env::var("RAXION_LOADGEN_REPORT_OUT").unwrap_or_else(|_| DEFAULT_OUT.to_owned()),
        );

        if agents == 0 {
            return Err(anyhow!("RAXION_LOADGEN_AGENTS must be > 0"));
        }
        if queries == 0 {
            return Err(anyhow!("RAXION_LOADGEN_QUERIES must be > 0"));
        }

        Ok(Self {
            cluster,
            rpc_url,
            program_id,
            wallet_path,
            agents,
            queries,
            stake_amount,
            low_score_every,
            challenge_fail_every,
            out_path,
        })
    }
}

fn run(cfg: Config) -> Result<()> {
    let payer = read_keypair_file(&cfg.wallet_path)
        .map_err(|e| anyhow!("failed to read wallet {}: {e}", cfg.wallet_path.display()))?;
    let payer = Rc::new(payer);
    let cluster = parse_cluster(&cfg.cluster, cfg.rpc_url.clone())?;
    let client = Client::new_with_options(cluster, payer, CommitmentConfig::confirmed());
    let program = client
        .program(cfg.program_id)
        .context("failed to create Anchor client program handle")?;

    println!(
        "[loadgen] cluster={} program={} agents={} queries={}",
        cfg.cluster, cfg.program_id, cfg.agents, cfg.queries
    );

    let mut agents = init_agents(&program, &cfg)?;
    let mut sample_sigs = Vec::new();
    let mut score_sum = 0.0f64;
    let mut below_reject = 0u64;
    let mut challenged = 0u64;
    let mut challenge_failures = 0u64;
    let mut trigger1_expected = 0u64;
    let mut trigger2_expected = 0u64;

    for i in 0..cfg.queries {
        let idx = (i % cfg.agents) as usize;
        let agent = &mut agents[idx];
        let inference_id = agent.inference_seq;
        agent.inference_seq = agent.inference_seq.saturating_add(1);
        agent.submitted = agent.submitted.saturating_add(1);

        let coherence_score = synthetic_score(i, cfg.low_score_every);
        score_sum += f64::from(coherence_score);
        if coherence_score < raxion_poiq::COHERENCE_THRESHOLD_REJECT {
            below_reject = below_reject.saturating_add(1);
            trigger1_expected = trigger1_expected.saturating_add(1);
        }

        let proof_hash = hash32("proof", agent.keypair.pubkey(), inference_id, i);
        let output_hash_t = hash32("out_t", agent.keypair.pubkey(), inference_id, i);
        let output_hash_s = hash32("out_s", agent.keypair.pubkey(), inference_id, i);
        let (agent_stake_pda, cognitive_pda, inference_pda) =
            derive_pdas(cfg.program_id, agent.keypair.pubkey(), inference_id);

        let sig = submit_convergence(
            &program,
            &agent.keypair,
            inference_id,
            coherence_score,
            proof_hash,
            output_hash_t,
            output_hash_s,
            agent_stake_pda,
            cognitive_pda,
            inference_pda,
        )?;
        if sample_sigs.len() < 24 {
            sample_sigs.push(sig.to_string());
        }

        let record: raxion_poiq::InferenceRecord = program
            .account(inference_pda)
            .with_context(|| format!("failed to fetch inference account {}", inference_pda))?;

        if record.challenged {
            challenged = challenged.saturating_add(1);
            if cfg.challenge_fail_every > 0 && challenged % cfg.challenge_fail_every == 0 {
                let response_hash = hash32("resp_fail", agent.keypair.pubkey(), inference_id, i);
                let sig = submit_challenge_response(
                    &program,
                    &agent.keypair,
                    inference_id,
                    response_hash,
                    false,
                    agent_stake_pda,
                    cognitive_pda,
                    inference_pda,
                )?;
                if sample_sigs.len() < 24 {
                    sample_sigs.push(sig.to_string());
                }
                challenge_failures = challenge_failures.saturating_add(1);
                trigger2_expected = trigger2_expected.saturating_add(1);
            }
        }

        if (i + 1) % 100 == 0 || i + 1 == cfg.queries {
            println!(
                "[loadgen] progress={}/{} avg_score={:.4} challenged={} t1={} t2={}",
                i + 1,
                cfg.queries,
                score_sum / (i + 1) as f64,
                challenged,
                trigger1_expected,
                trigger2_expected
            );
        }
    }

    let per_agent_queries = agents
        .iter()
        .map(|a| (a.keypair.pubkey().to_string(), a.submitted))
        .collect::<BTreeMap<_, _>>();

    let report = Report {
        cluster: cfg.cluster,
        rpc_url: cfg.rpc_url,
        program_id: cfg.program_id.to_string(),
        queries_total: cfg.queries,
        agents_total: cfg.agents,
        avg_coherence_score: score_sum / cfg.queries as f64,
        queries_below_reject_threshold: below_reject,
        challenged_queries: challenged,
        challenge_failures_submitted: challenge_failures,
        slash_trigger1_expected: trigger1_expected,
        slash_trigger2_expected: trigger2_expected,
        tx_signatures_sample: sample_sigs,
        per_agent_queries,
    };

    if let Some(parent) = cfg.out_path.parent() {
        fs::create_dir_all(parent).with_context(|| {
            format!(
                "failed to create report output directory {}",
                parent.display()
            )
        })?;
    }
    fs::write(&cfg.out_path, serde_json::to_string_pretty(&report)?).with_context(|| {
        format!(
            "failed to write loadgen report to {}",
            cfg.out_path.display()
        )
    })?;

    println!(
        "[loadgen] done. avg_score={:.4} report={}",
        report.avg_coherence_score,
        cfg.out_path.display()
    );
    Ok(())
}

fn init_agents(program: &Program<Rc<Keypair>>, cfg: &Config) -> Result<Vec<AgentState>> {
    let mut agents = Vec::with_capacity(cfg.agents as usize);
    for i in 0..cfg.agents {
        let keypair = Keypair::new();
        let (agent_stake_pda, cognitive_pda, _) = derive_pdas(cfg.program_id, keypair.pubkey(), 0);

        let sig = program
            .request()
            .accounts(raxion_poiq::accounts::InitializeAgentAccounts {
                payer: program.payer(),
                agent: keypair.pubkey(),
                agent_stake: agent_stake_pda,
                cognitive_account: cognitive_pda,
                system_program: anchor_client::solana_sdk::system_program::id(),
            })
            .args(raxion_poiq::instruction::InitializeAgentAccounts {
                stake_amount: cfg.stake_amount,
                staked_at_slot: 0,
            })
            .signer(&keypair)
            .send()
            .with_context(|| format!("initialize_agent_accounts failed for agent index {i}"))?;
        println!("[loadgen] initialized agent={} tx={sig}", keypair.pubkey());

        agents.push(AgentState {
            keypair,
            inference_seq: 1,
            submitted: 0,
        });
    }
    Ok(agents)
}

#[allow(clippy::too_many_arguments)]
fn submit_convergence(
    program: &Program<Rc<Keypair>>,
    agent: &Keypair,
    inference_id: u64,
    coherence_score: f32,
    proof_hash: [u8; 32],
    output_hash_t: [u8; 32],
    output_hash_s: [u8; 32],
    agent_stake: Pubkey,
    cognitive_account: Pubkey,
    inference_record: Pubkey,
) -> Result<Signature> {
    let sig = program
        .request()
        .accounts(raxion_poiq::accounts::SubmitConvergence {
            agent: agent.pubkey(),
            agent_stake,
            cognitive_account,
            slot_hashes: anchor_client::solana_sdk::sysvar::slot_hashes::id(),
            inference_record,
            system_program: anchor_client::solana_sdk::system_program::id(),
        })
        .args(raxion_poiq::instruction::SubmitConvergence {
            inference_id,
            coherence_score,
            proof_hash,
            output_hash_t,
            output_hash_s,
        })
        .signer(agent)
        .send()
        .with_context(|| format!("submit_convergence failed for inference_id={inference_id}"))?;
    Ok(sig)
}

fn submit_challenge_response(
    program: &Program<Rc<Keypair>>,
    agent: &Keypair,
    inference_id: u64,
    response_hash: [u8; 32],
    is_correct: bool,
    agent_stake: Pubkey,
    cognitive_account: Pubkey,
    inference_record: Pubkey,
) -> Result<Signature> {
    let sig = program
        .request()
        .accounts(raxion_poiq::accounts::SubmitChallengeResponse {
            agent: agent.pubkey(),
            agent_stake,
            cognitive_account,
            inference_record,
        })
        .args(raxion_poiq::instruction::SubmitChallengeResponse {
            inference_id,
            response_hash,
            is_correct,
        })
        .signer(agent)
        .send()
        .with_context(|| {
            format!(
                "submit_challenge_response failed for inference_id={inference_id} is_correct={is_correct}"
            )
        })?;
    Ok(sig)
}

fn derive_pdas(program_id: Pubkey, agent: Pubkey, inference_id: u64) -> (Pubkey, Pubkey, Pubkey) {
    let (agent_stake, _) = Pubkey::find_program_address(&[b"stake", agent.as_ref()], &program_id);
    let (cognitive, _) = Pubkey::find_program_address(&[b"cognitive", agent.as_ref()], &program_id);
    let (inference, _) = Pubkey::find_program_address(
        &[b"inference", agent.as_ref(), &inference_id.to_le_bytes()],
        &program_id,
    );
    (agent_stake, cognitive, inference)
}

fn synthetic_score(index: u64, low_every: u64) -> f32 {
    if low_every > 0 && index % low_every == 0 {
        // Guarantees Trigger-1 slashing events.
        return 0.20;
    }

    let bucket = index % 100;
    if bucket < 10 {
        0.58
    } else if bucket < 70 {
        0.72
    } else {
        0.88
    }
}

fn hash32(tag: &str, agent: Pubkey, inference_id: u64, index: u64) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(tag.as_bytes());
    hasher.update(agent.as_ref());
    hasher.update(inference_id.to_le_bytes());
    hasher.update(index.to_le_bytes());
    let digest = hasher.finalize();
    let mut out = [0u8; 32];
    out.copy_from_slice(&digest[..32]);
    out
}

fn parse_cluster(cluster: &str, rpc_url: Option<String>) -> Result<Cluster> {
    if let Some(url) = rpc_url {
        return Ok(Cluster::Custom(url.clone(), url));
    }

    match cluster.to_ascii_lowercase().as_str() {
        "devnet" => Ok(Cluster::Devnet),
        "testnet" => Ok(Cluster::Testnet),
        "localnet" | "local" => Ok(Cluster::Localnet),
        other => Err(anyhow!(
            "unsupported RAXION_CLUSTER={other}; use devnet|testnet|localnet or set RAXION_RPC_URL"
        )),
    }
}

fn parse_env_u64(key: &str, default: u64) -> Result<u64> {
    match env::var(key) {
        Ok(raw) => raw
            .parse::<u64>()
            .with_context(|| format!("invalid {key}={raw}")),
        Err(_) => Ok(default),
    }
}

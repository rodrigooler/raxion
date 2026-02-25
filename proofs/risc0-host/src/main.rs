use std::{env, process, time::Instant};

use anyhow::Result;
use risc0_types::{
    categorize, compute_cs_semantic, CoherenceCommitment, EmbeddingInput, ALPHA, BETA,
};
use risc0_zkvm::{default_prover, ExecutorEnv, Receipt};
use serde::Serialize;
use sha2::{Digest, Sha256};
use tokio::task;

mod methods {
    include!(concat!(env!("OUT_DIR"), "/methods.rs"));
}

#[derive(Debug, Serialize)]
struct RunMetrics {
    embedding_dim: usize,
    prove_time_s: f64,
    verify_time_s: f64,
    total_time_s: f64,
    coherence_score: f32,
    cs_semantic: f32,
    category: u8,
    expected_score: f32,
    score_delta: f32,
    embedding_t_hash: String,
    embedding_s_hash: String,
    embedding_n_hash: String,
}

#[derive(Debug, Clone)]
struct CliArgs {
    dim: usize,
    with_n: bool,
    json: bool,
}

impl Default for CliArgs {
    fn default() -> Self {
        Self {
            dim: 384,
            with_n: false,
            json: false,
        }
    }
}

fn parse_args() -> Result<CliArgs> {
    let mut args = CliArgs::default();
    let mut iter = env::args().skip(1);
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--dim" => {
                let value = iter
                    .next()
                    .ok_or_else(|| anyhow::anyhow!("Missing value for --dim"))?;
                args.dim = value.parse::<usize>()?;
            }
            "--with-n" => {
                args.with_n = true;
            }
            "--json" => {
                args.json = true;
            }
            "--help" | "-h" => {
                println!("Usage: cargo run -p risc0-host -- [--dim N] [--with-n] [--json]");
                process::exit(0);
            }
            _ => return Err(anyhow::anyhow!("Unknown argument: {arg}")),
        }
    }
    Ok(args)
}

fn seeded_embedding(label: &str, dim: usize) -> Vec<f32> {
    let mut values = Vec::with_capacity(dim);
    let mut counter: u64 = 0;

    while values.len() < dim {
        let mut hasher = Sha256::new();
        hasher.update(label.as_bytes());
        hasher.update(counter.to_le_bytes());
        let digest = hasher.finalize();

        for chunk in digest.chunks_exact(4) {
            if values.len() >= dim {
                break;
            }
            let raw = u32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]);
            let normalized = (raw as f32 / u32::MAX as f32) * 2.0 - 1.0;
            values.push(normalized);
        }
        counter = counter.saturating_add(1);
    }

    let norm = values.iter().map(|v| v * v).sum::<f32>().sqrt();
    if norm > 0.0 {
        for value in &mut values {
            *value /= norm;
        }
    }

    values
}

fn hash_embeddings(emb: &[f32]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    for value in emb {
        hasher.update(value.to_le_bytes());
    }
    hasher.finalize().into()
}

fn expected_score(input: &EmbeddingInput) -> f32 {
    let cs = compute_cs_semantic(
        &input.embedding_t,
        &input.embedding_s,
        input.embedding_n.as_deref(),
    );
    let cc = (0.8 * cs + 0.14).clamp(0.0, 1.0);
    (ALPHA * cs + BETA * cc).clamp(0.0, 1.0)
}

async fn generate_proof(input: EmbeddingInput) -> Result<(Receipt, CoherenceCommitment, f64)> {
    task::spawn_blocking(move || -> Result<(Receipt, CoherenceCommitment, f64)> {
        let env = ExecutorEnv::builder().write(&input)?.build()?;

        let start = Instant::now();
        let prover = default_prover();
        let receipt = prover.prove(env, methods::RAXION_INFERENCE_PROOF_ELF)?.receipt;
        let prove_time_s = start.elapsed().as_secs_f64();

        let commitment: CoherenceCommitment = receipt.journal.decode()?;
        Ok((receipt, commitment, prove_time_s))
    })
    .await
    .map_err(|err| anyhow::anyhow!("proof task join error: {err}"))?
}

async fn verify_proof(receipt: Receipt) -> Result<f64> {
    task::spawn_blocking(move || -> Result<f64> {
        let start = Instant::now();
        receipt.verify(methods::RAXION_INFERENCE_PROOF_ID)?;
        Ok(start.elapsed().as_secs_f64())
    })
    .await
    .map_err(|err| anyhow::anyhow!("verification task join error: {err}"))?
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = parse_args()?;

    let input = EmbeddingInput {
        embedding_t: seeded_embedding("transformer", args.dim),
        embedding_s: seeded_embedding("ssm", args.dim),
        embedding_n: if args.with_n {
            Some(seeded_embedding("neurosymbolic", args.dim))
        } else {
            None
        },
        architecture_ids: [
            "transformer".to_owned(),
            "ssm".to_owned(),
            "neurosymbolic".to_owned(),
        ],
    };

    let expected = expected_score(&input);
    let expected_category = categorize(expected);

    if !args.json {
        println!("RAXION Phase 1 - Proof of Quality (pi_quality)");
        println!("Embedding dim: {}", args.dim);
        println!("Third architecture included: {}", args.with_n);
        println!("[RAXION] Generating proof...");
    }

    let total_start = Instant::now();
    let (receipt, commitment, prove_time_s) = generate_proof(input.clone()).await?;
    let verify_time_s = verify_proof(receipt).await?;
    let total_time_s = total_start.elapsed().as_secs_f64();

    let delta = (commitment.coherence_score - expected).abs();

    let metrics = RunMetrics {
        embedding_dim: args.dim,
        prove_time_s,
        verify_time_s,
        total_time_s,
        coherence_score: commitment.coherence_score,
        cs_semantic: commitment.cs_semantic,
        category: commitment.category,
        expected_score: expected,
        score_delta: delta,
        embedding_t_hash: format!("0x{}", hex::encode(commitment.embedding_t_hash)),
        embedding_s_hash: format!("0x{}", hex::encode(commitment.embedding_s_hash)),
        embedding_n_hash: format!("0x{}", hex::encode(commitment.embedding_n_hash)),
    };

    if args.json {
        println!("{}", serde_json::to_string(&metrics)?);
    } else {
        println!("[RAXION] Proof generated in {:.2}s", metrics.prove_time_s);
        println!("[RAXION] Verification completed in {:.3}s", metrics.verify_time_s);
        println!("[RAXION] Total run time {:.2}s", metrics.total_time_s);
        println!("[RAXION] ✅ Proof verified successfully");
        println!("Coherence score (zkVM): {:.6}", metrics.coherence_score);
        println!("Coherence score (host): {:.6}", metrics.expected_score);
        println!("Score delta: {:.6}", metrics.score_delta);
        println!(
            "Category (zkVM/host): {}/{}",
            metrics.category, expected_category
        );
    }

    Ok(())
}

use std::{env, process, time::Instant};

use anyhow::Result;
use risc0_types::InferenceCommitment;
use risc0_zkvm::{default_prover, ExecutorEnv, Receipt};
use serde::Serialize;

mod methods {
    include!(concat!(env!("OUT_DIR"), "/methods.rs"));
}

#[derive(Debug, Serialize)]
struct RunMetrics {
    input_bytes: usize,
    output_bytes: usize,
    architecture: String,
    prove_time_s: f64,
    verify_time_s: f64,
    total_time_s: f64,
    input_hash: String,
    output_hash: String,
    joint_commitment: String,
}

#[derive(Debug, Clone)]
struct CliArgs {
    input_bytes: usize,
    output_bytes: usize,
    architecture: String,
    json: bool,
}

impl Default for CliArgs {
    fn default() -> Self {
        Self {
            input_bytes: 64,
            output_bytes: 256,
            architecture: "transformer".to_owned(),
            json: false,
        }
    }
}

fn parse_args() -> Result<CliArgs> {
    let mut args = CliArgs::default();
    let mut iter = env::args().skip(1);
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--input-bytes" => {
                let value = iter
                    .next()
                    .ok_or_else(|| anyhow::anyhow!("Missing value for --input-bytes"))?;
                args.input_bytes = value.parse::<usize>()?;
            }
            "--output-bytes" => {
                let value = iter
                    .next()
                    .ok_or_else(|| anyhow::anyhow!("Missing value for --output-bytes"))?;
                args.output_bytes = value.parse::<usize>()?;
            }
            "--architecture" => {
                args.architecture = iter
                    .next()
                    .ok_or_else(|| anyhow::anyhow!("Missing value for --architecture"))?;
            }
            "--json" => {
                args.json = true;
            }
            "--help" | "-h" => {
                println!(
                    "Usage: cargo run -p risc0-host -- [--input-bytes N] [--output-bytes N] [--architecture NAME] [--json]"
                );
                process::exit(0);
            }
            _ => return Err(anyhow::anyhow!("Unknown argument: {arg}")),
        }
    }
    Ok(args)
}

fn payload(prefix: &str, target_bytes: usize) -> String {
    if target_bytes == 0 {
        return String::new();
    }
    let mut s = String::from(prefix);
    let filler = "0123456789abcdef";
    while s.len() < target_bytes {
        s.push_str(filler);
    }
    s.truncate(target_bytes);
    s
}

fn generate_proof(
    input: &str,
    output: &str,
    architecture: &str,
) -> Result<(Receipt, InferenceCommitment, f64)> {
    let env = ExecutorEnv::builder()
        .write(&input.as_bytes())?
        .write(&output.as_bytes())?
        .write(&architecture)?
        .build()?;

    let start = Instant::now();

    let prover = default_prover();
    let receipt = prover
        .prove(env, methods::RAXION_INFERENCE_PROOF_ELF)?
        .receipt;
    let prove_time_s = start.elapsed().as_secs_f64();

    let commitment: InferenceCommitment = receipt.journal.decode()?;

    Ok((receipt, commitment, prove_time_s))
}

fn verify_proof(receipt: &Receipt) -> Result<f64> {
    let start = Instant::now();
    receipt.verify(methods::RAXION_INFERENCE_PROOF_ID)?;
    Ok(start.elapsed().as_secs_f64())
}

fn main() -> Result<()> {
    let args = parse_args()?;
    let input = payload(
        "Explain the Oracle Problem in decentralized AI systems. ",
        args.input_bytes,
    );
    let output = payload(
        "The Oracle Problem is the challenge of importing external truth into deterministic consensus. ",
        args.output_bytes,
    );

    if !args.json {
        println!("RAXION Phase 0 - Proof of Execution (pi_exec)");
        println!("Input bytes: {}", input.len());
        println!("Output bytes: {}", output.len());
        println!("Architecture: {}", args.architecture);
        println!("[RAXION] Generating proof...");
    }

    let total_start = Instant::now();
    let (receipt, commitment, prove_time_s) = generate_proof(&input, &output, &args.architecture)?;
    let verify_time_s = verify_proof(&receipt)?;
    let total_time_s = total_start.elapsed().as_secs_f64();

    let metrics = RunMetrics {
        input_bytes: input.len(),
        output_bytes: output.len(),
        architecture: commitment.architecture.clone(),
        prove_time_s,
        verify_time_s,
        total_time_s,
        input_hash: format!("0x{}", hex::encode(commitment.input_hash)),
        output_hash: format!("0x{}", hex::encode(commitment.output_hash)),
        joint_commitment: format!("0x{}", hex::encode(commitment.joint_commitment)),
    };

    if args.json {
        println!("{}", serde_json::to_string(&metrics)?);
    } else {
        println!("[RAXION] Proof generated in {:.2}s", metrics.prove_time_s);
        println!(
            "[RAXION] Verification completed in {:.3}s",
            metrics.verify_time_s
        );
        println!("[RAXION] Total run time {:.2}s", metrics.total_time_s);
        println!("[RAXION] ✅ Proof verified successfully");
        println!("Input hash:       {}", metrics.input_hash);
        println!("Output hash:      {}", metrics.output_hash);
        println!("Joint commitment: {}", metrics.joint_commitment);
    }

    Ok(())
}

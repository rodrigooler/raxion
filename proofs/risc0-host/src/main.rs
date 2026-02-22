use std::time::Instant;

use anyhow::Result;
use risc0_zkvm::{default_prover, ExecutorEnv, Receipt};

mod methods {
    include!(concat!(env!("OUT_DIR"), "/methods.rs"));
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct InferenceCommitment {
    pub input_hash: [u8; 32],
    pub output_hash: [u8; 32],
    pub joint_commitment: [u8; 32],
    pub architecture: String,
}

fn generate_proof(
    input: &str,
    output: &str,
    architecture: &str,
) -> Result<(Receipt, InferenceCommitment)> {
    println!("[RAXION] Preparing zkVM environment...");

    let env = ExecutorEnv::builder()
        .write(&input.as_bytes().to_vec())?
        .write(&output.as_bytes().to_vec())?
        .write(&architecture.to_string())?
        .build()?;

    println!("[RAXION] Generating proof (this takes 15-40s on CPU)...");
    let start = Instant::now();

    let prover = default_prover();
    let receipt = prover.prove(env, methods::RAXION_INFERENCE_PROOF_ELF)?.receipt;

    let elapsed = start.elapsed();
    println!("[RAXION] Proof generated in {:.2}s", elapsed.as_secs_f64());

    let commitment: InferenceCommitment = receipt.journal.decode()?;

    Ok((receipt, commitment))
}

fn verify_proof(receipt: &Receipt) -> Result<()> {
    println!("[RAXION] Verifying proof...");
    receipt.verify(methods::RAXION_INFERENCE_PROOF_ID)?;
    println!("[RAXION] Proof verified successfully");
    Ok(())
}

fn main() -> Result<()> {
    let input = "Explain the Oracle Problem in decentralized AI systems.";
    let output_transformer = "The Oracle Problem in decentralized AI refers to the fundamental challenge of reliably importing external ground-truth into a blockchain system.";

    println!("RAXION Phase 0 - Proof of Execution (pi_exec)");
    println!("Input:  \"{}...\"", &input[..30]);
    println!("Output: \"{}...\"", &output_transformer[..30]);

    let (receipt, commitment) = generate_proof(input, output_transformer, "transformer")?;
    verify_proof(&receipt)?;

    println!("Architecture:     {}", commitment.architecture);
    println!("Input hash:       0x{}", hex::encode(commitment.input_hash));
    println!("Output hash:      0x{}", hex::encode(commitment.output_hash));
    println!("Joint commitment: 0x{}", hex::encode(commitment.joint_commitment));

    Ok(())
}

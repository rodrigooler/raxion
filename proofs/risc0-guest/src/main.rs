#![no_main]
#![no_std]

extern crate alloc;
use alloc::vec::Vec;

use alloc::string::String;
use risc0_types::InferenceCommitment;
use risc0_zkvm::guest::env;
use sha2::{Digest, Sha256};

risc0_zkvm::guest::entry!(main);

fn main() {
    let input_bytes: Vec<u8> = env::read();
    let output_bytes: Vec<u8> = env::read();
    let architecture: String = env::read();

    let input_hash: [u8; 32] = {
        let mut hasher = Sha256::new();
        hasher.update(&input_bytes);
        hasher.finalize().into()
    };

    let output_hash: [u8; 32] = {
        let mut hasher = Sha256::new();
        hasher.update(&output_bytes);
        hasher.finalize().into()
    };

    let joint_commitment: [u8; 32] = {
        let mut hasher = Sha256::new();
        hasher.update(input_hash);
        hasher.update(output_hash);
        hasher.update(architecture.as_bytes());
        hasher.finalize().into()
    };

    env::commit(&InferenceCommitment {
        input_hash,
        output_hash,
        joint_commitment,
        architecture,
    });
}

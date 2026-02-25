#![no_std]

extern crate alloc;

use alloc::string::String;
use serde::{Deserialize, Serialize};

pub mod coherence;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InferenceCommitment {
    pub input_hash: [u8; 32],
    pub output_hash: [u8; 32],
    pub joint_commitment: [u8; 32],
    pub architecture: String,
}

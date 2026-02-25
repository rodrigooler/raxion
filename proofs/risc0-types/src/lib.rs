#![no_std]

extern crate alloc;

use alloc::{string::String, vec::Vec};
use serde::{Deserialize, Serialize};

pub mod coherence;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InferenceCommitment {
    pub input_hash: [u8; 32],
    pub output_hash: [u8; 32],
    pub joint_commitment: [u8; 32],
    pub architecture: String,
}

/// Guest input for Q2 coherence proving path.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EmbeddingInput {
    /// Transformer embedding (L2-normalized)
    pub embedding_t: Vec<f32>,
    /// SSM embedding (L2-normalized)
    pub embedding_s: Vec<f32>,
    /// Neuro-symbolic embedding (L2-normalized), optional in PoC mode
    pub embedding_n: Option<Vec<f32>>,
    /// Architecture IDs tied to this computation
    pub architecture_ids: [String; 3],
}

/// Public commitment committed to zkVM journal.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CoherenceCommitment {
    pub coherence_score: f32,
    pub cs_semantic: f32,
    pub embedding_t_hash: [u8; 32],
    pub embedding_s_hash: [u8; 32],
    pub embedding_n_hash: [u8; 32],
    /// 0=REJECTED, 1=LOW_CONFIDENCE, 2=STANDARD, 3=HIGH_COHERENCE
    pub category: u8,
}

// Whitepaper-locked parameters (Q2 source of truth)
pub const ALPHA: f32 = 0.4;
pub const BETA: f32 = 0.6;
pub const THRESHOLD_REJECT: f32 = 0.30;
pub const THRESHOLD_STANDARD: f32 = 0.60;
pub const THRESHOLD_HIGH: f32 = 0.85;

pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    assert_eq!(a.len(), b.len(), "embedding dimensions must match");
    a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
}

pub fn geometric_mean_3(a: f32, b: f32, c: f32) -> f32 {
    if a <= 0.0 || b <= 0.0 || c <= 0.0 {
        return 0.0;
    }
    (a * b * c).powf(1.0 / 3.0)
}

pub fn normalize_sim(sim: f32) -> f32 {
    (sim + 1.0) / 2.0
}

pub fn compute_cs_semantic(emb_t: &[f32], emb_s: &[f32], emb_n: Option<&[f32]>) -> f32 {
    let sim_ts = normalize_sim(cosine_similarity(emb_t, emb_s));

    let (sim_tn, sim_sn) = match emb_n {
        Some(n) => (
            normalize_sim(cosine_similarity(emb_t, n)),
            normalize_sim(cosine_similarity(emb_s, n)),
        ),
        None => (sim_ts, sim_ts),
    };

    geometric_mean_3(sim_ts, sim_tn, sim_sn)
}

pub fn categorize(score: f32) -> u8 {
    if score < THRESHOLD_REJECT {
        0
    } else if score < THRESHOLD_STANDARD {
        1
    } else if score < THRESHOLD_HIGH {
        2
    } else {
        3
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    const EPS: f32 = 1e-6;

    #[test]
    fn test_cosine_identical_vectors() {
        let v = vec![1.0_f32, 0.0, 0.0];
        assert!((cosine_similarity(&v, &v) - 1.0).abs() < EPS);
    }

    #[test]
    fn test_geometric_mean_penalizes_outlier() {
        let geo = geometric_mean_3(0.9, 0.9, 0.1);
        let arith = (0.9 + 0.9 + 0.1) / 3.0;
        assert!(geo < arith);
    }

    #[test]
    fn test_alpha_beta_sum_to_one() {
        assert!((ALPHA + BETA - 1.0).abs() < EPS);
    }

    #[test]
    fn test_thresholds_match_protocol() {
        assert!((THRESHOLD_REJECT - 0.30).abs() < EPS);
        assert!((THRESHOLD_STANDARD - 0.60).abs() < EPS);
        assert!((THRESHOLD_HIGH - 0.85).abs() < EPS);
    }

    #[test]
    fn test_compute_cs_semantic_without_third_arch() {
        let t = vec![1.0_f32, 0.0, 0.0];
        let s = vec![1.0_f32, 0.0, 0.0];
        let cs = compute_cs_semantic(&t, &s, None);
        assert!((cs - 1.0).abs() < EPS);
    }
}

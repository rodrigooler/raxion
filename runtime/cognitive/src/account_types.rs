//! CognitiveAccount - Extended account type for RAXION Smart Agents.
//!
//! INVARIANTS:
//! 1. hot_state_bytes() <= HOT_STATE_MAX_BYTES
//! 2. stake_rax >= MINIMUM_STAKE_RAX for active accounts
//! 3. reliability_score is always clamped in [0.0, 1.0]

use borsh::{BorshDeserialize, BorshSerialize};
use solana_sdk::pubkey::Pubkey;
use thiserror::Error;

/// 3MB hot state ceiling.
pub const HOT_STATE_MAX_BYTES: usize = 3 * 1024 * 1024;

/// Minimum stake for one cognition thread, in RAX units.
pub const MINIMUM_STAKE_RAX: u64 = 1_000;

/// Proof ring size as documented in whitepaper/memory.
pub const PROOF_RING_CAPACITY: usize = 256;

pub const INITIAL_RELIABILITY_SCORE: f32 = 0.80;
pub const RS_PROBATION_THRESHOLD: f32 = 0.50;
pub const RS_PREMIUM_THRESHOLD: f32 = 0.70;
pub const RS_CHRONIC_THRESHOLD: f32 = 0.40;

#[derive(Debug, Clone, BorshSerialize, BorshDeserialize)]
pub struct CognitiveAccount {
    pub version: u8,
    pub owner: Pubkey,

    /// Stake measured in RAX token units.
    pub stake_rax: u64,

    pub merkle_root: [u8; 32],
    pub reliability_score: f32,
    pub last_updated_slot: u64,
    pub cold_state_arweave_tx: [u8; 64],
    pub proof_history: Vec<[u8; 32]>,
    pub rag_index_root: [u8; 32],
    pub architecture_type: [u8; 16],
    pub inference_count: u64,
    pub in_rehabilitation: bool,
    pub rehabilitation_start_slot: u64,
}

impl CognitiveAccount {
    pub fn new(
        owner: Pubkey,
        stake_rax: u64,
        architecture_type: &str,
    ) -> Result<Self, CognitiveAccountError> {
        if stake_rax < MINIMUM_STAKE_RAX {
            return Err(CognitiveAccountError::InsufficientStake {
                provided: stake_rax,
                minimum: MINIMUM_STAKE_RAX,
            });
        }

        let arch_bytes = architecture_type.as_bytes();
        if arch_bytes.len() > 16 {
            return Err(CognitiveAccountError::ArchitectureTypeTooLong);
        }

        let mut arch = [0u8; 16];
        arch[..arch_bytes.len()].copy_from_slice(arch_bytes);

        Ok(Self {
            version: 1,
            owner,
            stake_rax,
            merkle_root: [0u8; 32],
            reliability_score: INITIAL_RELIABILITY_SCORE,
            last_updated_slot: 0,
            cold_state_arweave_tx: [0u8; 64],
            proof_history: Vec::with_capacity(PROOF_RING_CAPACITY),
            rag_index_root: [0u8; 32],
            architecture_type: arch,
            inference_count: 0,
            in_rehabilitation: false,
            rehabilitation_start_slot: 0,
        })
    }

    /// Formula: floor(log2(stake/1000) * 8) + 1
    /// Whitepaper examples:
    /// 1,000 -> 1 | 8,000 -> 25 | 100,000 -> 54 | 1,000,000 -> 80
    pub fn max_threads(&self) -> u32 {
        let stake_units = self.stake_rax / MINIMUM_STAKE_RAX;
        if stake_units < 1 {
            return 1;
        }
        let log2 = (stake_units as f64).log2();
        (log2 * 8.0).floor() as u32 + 1
    }

    pub fn reward_multiplier(&self) -> f32 {
        if self.reliability_score < RS_PROBATION_THRESHOLD {
            return 0.5;
        }
        if self.reliability_score > RS_PREMIUM_THRESHOLD {
            return 1.0 + (self.reliability_score - RS_PREMIUM_THRESHOLD) * 2.0;
        }
        1.0
    }

    pub fn challenge_rate(&self) -> f32 {
        if self.inference_count < 100 {
            0.05
        } else {
            0.015
        }
    }

    pub fn push_proof(&mut self, proof_ref: [u8; 32]) {
        if self.proof_history.len() >= PROOF_RING_CAPACITY {
            let _ = self.proof_history.remove(0);
        }
        self.proof_history.push(proof_ref);
    }

    pub fn update_reliability_score(&mut self, challenge_result: f32) {
        let lambda = 0.1_f32;
        self.reliability_score =
            ((1.0 - lambda) * self.reliability_score + lambda * challenge_result).clamp(0.0, 1.0);
    }

    pub fn hot_state_bytes(&self) -> usize {
        // Approximation for runtime guardrails.
        let fixed_bytes = 1 + 32 + 8 + 32 + 4 + 8 + 64 + 32 + 16 + 8 + 1 + 8;
        fixed_bytes + (self.proof_history.len() * 32)
    }

    pub fn within_size_limit(&self) -> bool {
        self.hot_state_bytes() <= HOT_STATE_MAX_BYTES
    }

    pub fn is_in_probation(&self) -> bool {
        self.reliability_score < RS_PROBATION_THRESHOLD
    }

    pub fn below_rehabilitation_threshold(&self) -> bool {
        self.reliability_score < RS_CHRONIC_THRESHOLD
    }
}

#[derive(Debug, Error)]
pub enum CognitiveAccountError {
    #[error("Insufficient stake: provided {provided}, minimum {minimum}")]
    InsufficientStake { provided: u64, minimum: u64 },

    #[error("Hot state exceeds limit: {size} bytes > {limit} bytes")]
    HotStateExceededLimit { size: usize, limit: usize },

    #[error("Architecture type string too long (max 16 bytes)")]
    ArchitectureTypeTooLong,

    #[error("Reliability score out of bounds: {score}")]
    ReliabilityScoreOutOfBounds { score: f32 },
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_pubkey() -> Pubkey {
        Pubkey::new_unique()
    }

    #[test]
    fn test_new_account_valid() {
        let account = CognitiveAccount::new(test_pubkey(), 1_000, "transformer")
            .expect("new account should succeed");
        assert_eq!(account.version, 1);
        assert_eq!(account.reliability_score, INITIAL_RELIABILITY_SCORE);
        assert!(!account.in_rehabilitation);
    }

    #[test]
    fn test_insufficient_stake_rejected() {
        let result = CognitiveAccount::new(test_pubkey(), 999, "transformer");
        assert!(matches!(
            result,
            Err(CognitiveAccountError::InsufficientStake { .. })
        ));
    }

    #[test]
    fn test_architecture_too_long_rejected() {
        let result = CognitiveAccount::new(test_pubkey(), 1_000, "neuro-symbolic-long-name");
        assert!(matches!(
            result,
            Err(CognitiveAccountError::ArchitectureTypeTooLong)
        ));
    }

    #[test]
    fn test_max_threads_whitepaper_examples() {
        let a1 = CognitiveAccount::new(test_pubkey(), 1_000, "transformer").unwrap();
        let a2 = CognitiveAccount::new(test_pubkey(), 8_000, "transformer").unwrap();
        let a3 = CognitiveAccount::new(test_pubkey(), 100_000, "transformer").unwrap();
        let a4 = CognitiveAccount::new(test_pubkey(), 1_000_000, "transformer").unwrap();

        assert_eq!(a1.max_threads(), 1);
        assert_eq!(a2.max_threads(), 25);
        // Derived strictly from formula:
        // floor(log2(100_000 / 1_000) * 8) + 1 = 54
        assert_eq!(a3.max_threads(), 54);
        // floor(log2(1_000_000 / 1_000) * 8) + 1 = 80
        assert_eq!(a4.max_threads(), 80);
    }

    #[test]
    fn test_reliability_score_bounded() {
        let mut account = CognitiveAccount::new(test_pubkey(), 1_000, "transformer").unwrap();
        for _ in 0..100 {
            account.update_reliability_score(2.0);
        }
        assert!(account.reliability_score <= 1.0);

        for _ in 0..100 {
            account.update_reliability_score(-2.0);
        }
        assert!(account.reliability_score >= 0.0);
    }

    #[test]
    fn test_reliability_ema_formula() {
        let mut account = CognitiveAccount::new(test_pubkey(), 1_000, "transformer").unwrap();
        let initial = account.reliability_score;
        account.update_reliability_score(1.0);
        let expected = 0.9 * initial + 0.1 * 1.0;
        assert!((account.reliability_score - expected).abs() < 1e-6);
    }

    #[test]
    fn test_reward_multiplier_examples() {
        let mut account = CognitiveAccount::new(test_pubkey(), 1_000, "transformer").unwrap();

        account.reliability_score = 0.40;
        assert_eq!(account.reward_multiplier(), 0.5);

        account.reliability_score = 0.70;
        assert_eq!(account.reward_multiplier(), 1.0);

        account.reliability_score = 0.95;
        assert!((account.reward_multiplier() - 1.50).abs() < 1e-6);
    }

    #[test]
    fn test_proof_ring_evicts_oldest() {
        let mut account = CognitiveAccount::new(test_pubkey(), 1_000, "transformer").unwrap();
        let first_proof = [1u8; 32];
        account.push_proof(first_proof);

        for i in 0..PROOF_RING_CAPACITY {
            account.push_proof([i as u8; 32]);
        }

        assert_eq!(account.proof_history.len(), PROOF_RING_CAPACITY);
        assert_ne!(account.proof_history[0], first_proof);
    }

    #[test]
    fn test_hot_state_within_limit() {
        let account = CognitiveAccount::new(test_pubkey(), 1_000, "transformer").unwrap();
        assert!(account.within_size_limit());
    }

    #[test]
    fn test_challenge_rate_warmup_and_steady_state() {
        let mut account = CognitiveAccount::new(test_pubkey(), 1_000, "transformer").unwrap();
        assert!((account.challenge_rate() - 0.05).abs() < 1e-9);

        account.inference_count = 100;
        assert!((account.challenge_rate() - 0.015).abs() < 1e-9);
    }
}

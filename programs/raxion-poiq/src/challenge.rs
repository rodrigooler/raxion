//! Stochastic verification - deterministic challenge generation.

use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};

pub const CHALLENGE_CATEGORY_MATH: u8 = 0;
pub const CHALLENGE_CATEGORY_CODE: u8 = 1;
pub const N_CHALLENGE_CATEGORIES: u8 = 6;

/// All 6 challenge categories.
#[derive(Debug, Clone, Copy, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
#[repr(u8)]
pub enum ChallengeCategory {
    /// Formal mathematical proof/refutation.
    MathFormal = 0,
    /// Code output prediction with fixed input.
    CodeExecution = 1,
    /// Propositional logic satisfiability.
    LogicSat = 2,
    /// Fact verifiable from on-chain state.
    FactualOnchain = 3,
    /// Signature/hash verification.
    CryptoVerify = 4,
    /// Numerical result within tolerance.
    NumericalApprox = 5,
}

impl ChallengeCategory {
    /// Deterministic category selection from seed bytes.
    pub fn from_seed(seed: &[u8; 32]) -> Self {
        let selector = u16::from_le_bytes([seed[4], seed[5]]) % u16::from(N_CHALLENGE_CATEGORIES);
        match selector {
            0 => Self::MathFormal,
            1 => Self::CodeExecution,
            2 => Self::LogicSat,
            3 => Self::FactualOnchain,
            4 => Self::CryptoVerify,
            _ => Self::NumericalApprox,
        }
    }
}

/// Determines whether an inference should be challenged.
/// PoIQ Layer 2 formula (Whitepaper Chapter 3):
/// `challenge_seed = HASH(slot_hash || inf_id || stake_seed)`.
/// Decision rule: `is_challenged = challenge_seed mod 1000 < rate_per_1000`.
pub fn should_challenge(
    slot_hash: &[u8; 32],
    inf_id: u64,
    stake_seed: u64,
    rate_per_1000: u16,
) -> bool {
    let bounded_rate = rate_per_1000.min(1000);
    let seed = compute_challenge_seed(slot_hash, inf_id, stake_seed);
    (seed % 1000) < u64::from(bounded_rate)
}

/// Determines challenge category independent from challenge decision.
/// Uses the same seed derivation base from `compute_challenge_seed`
/// and a secondary hash stream (Whitepaper Chapter 3, Layer 2).
pub fn challenge_category(slot_hash: &[u8; 32], inf_id: u64, stake_seed: u64) -> u8 {
    challenge_category_enum(slot_hash, inf_id, stake_seed) as u8
}

/// Same as `challenge_category`, but returns a typed enum.
pub fn challenge_category_enum(
    slot_hash: &[u8; 32],
    inf_id: u64,
    stake_seed: u64,
) -> ChallengeCategory {
    let seed = compute_challenge_seed(slot_hash, inf_id, stake_seed);
    let mut hasher = Sha256::new();
    hasher.update(seed.to_le_bytes());
    hasher.update(b"category");
    let digest = hasher.finalize();
    let mut category_seed = [0u8; 32];
    category_seed.copy_from_slice(&digest[..32]);
    ChallengeCategory::from_seed(&category_seed)
}

/// Verify challenge response deterministically by category.
pub fn verify_response(category: ChallengeCategory, response: &str, expected: &str) -> bool {
    match category {
        ChallengeCategory::MathFormal | ChallengeCategory::CodeExecution => {
            normalize(response) == normalize(expected)
        }
        ChallengeCategory::LogicSat => {
            let r = response.trim().to_ascii_uppercase();
            let e = expected.trim().to_ascii_uppercase();
            r == e && (r == "SAT" || r == "UNSAT")
        }
        ChallengeCategory::FactualOnchain | ChallengeCategory::CryptoVerify => {
            normalize(response) == normalize(expected)
        }
        ChallengeCategory::NumericalApprox => {
            let r = response.trim().parse::<f64>().ok();
            let e = expected.trim().parse::<f64>().ok();
            match (r, e) {
                (Some(rv), Some(ev)) => {
                    if ev == 0.0 {
                        rv.abs() < 1e-6
                    } else {
                        ((rv - ev) / ev).abs() < 0.001
                    }
                }
                _ => false,
            }
        }
    }
}

fn normalize(s: &str) -> String {
    s.split_whitespace()
        .collect::<String>()
        .to_ascii_lowercase()
}

fn compute_challenge_seed(slot_hash: &[u8; 32], inf_id: u64, stake_seed: u64) -> u64 {
    let mut hasher = Sha256::new();
    hasher.update(slot_hash);
    hasher.update(inf_id.to_le_bytes());
    hasher.update(stake_seed.to_le_bytes());
    let digest = hasher.finalize();
    let mut first_8 = [0u8; 8];
    first_8.copy_from_slice(&digest[..8]);
    u64::from_le_bytes(first_8)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_determinism_same_inputs_same_result() {
        let slot_hash = [42u8; 32];
        let inf_id = 12345u64;
        let stake_seed = 99999u64;

        let result1 = should_challenge(&slot_hash, inf_id, stake_seed, 15);
        let result2 = should_challenge(&slot_hash, inf_id, stake_seed, 15);
        assert_eq!(result1, result2);
    }

    #[test]
    fn test_challenge_rate_approximately_1_5_percent() {
        let stake_seed = 42u64;
        let mut challenged = 0u32;
        let n = 10_000u64;

        for inf_id in 0..n {
            let mut slot_hash = [0u8; 32];
            slot_hash[..8].copy_from_slice(&inf_id.to_le_bytes());
            if should_challenge(&slot_hash, inf_id, stake_seed, 15) {
                challenged += 1;
            }
        }

        let rate = challenged as f64 / n as f64;
        assert!(
            (rate - 0.015).abs() < 0.005,
            "rate={} challenged={}",
            rate,
            challenged
        );
    }

    #[test]
    fn test_category_is_in_devnet_range() {
        for inf_id in 0..1024u64 {
            let mut slot_hash = [0u8; 32];
            slot_hash[..8].copy_from_slice(&inf_id.to_le_bytes());
            let category = challenge_category(&slot_hash, inf_id, 123);
            assert!(category < N_CHALLENGE_CATEGORIES);
        }
    }

    #[test]
    fn test_category_determinism() {
        let slot_hash = [7u8; 32];
        let cat1 = challenge_category(&slot_hash, 1, 1);
        let cat2 = challenge_category(&slot_hash, 1, 1);
        assert_eq!(cat1, cat2);
    }

    #[test]
    fn test_challenge_rate_for_new_agents_approximately_5_percent() {
        let stake_seed = 77u64;
        let mut challenged = 0u32;
        let n = 10_000u64;

        for inf_id in 0..n {
            let mut slot_hash = [0u8; 32];
            slot_hash[..8].copy_from_slice(&inf_id.to_le_bytes());
            if should_challenge(&slot_hash, inf_id, stake_seed, 50) {
                challenged += 1;
            }
        }

        let rate = challenged as f64 / n as f64;
        assert!(
            (rate - 0.05).abs() < 0.01,
            "rate={} challenged={}",
            rate,
            challenged
        );
    }

    #[test]
    fn test_category_selection_is_not_trivially_equal_to_challenge_outcome() {
        let mut equal_count = 0usize;
        let n = 1024u64;

        for inf_id in 0..n {
            let mut slot_hash = [0u8; 32];
            slot_hash[..8].copy_from_slice(&inf_id.to_le_bytes());
            let challenged = should_challenge(&slot_hash, inf_id, 11, 15);
            let category = challenge_category(&slot_hash, inf_id, 11);
            if (challenged && category == CHALLENGE_CATEGORY_CODE)
                || (!challenged && category == CHALLENGE_CATEGORY_MATH)
            {
                equal_count += 1;
            }
        }

        // If streams were coupled, equal_count would collapse near extremes.
        // This broad guard ensures we don't accidentally tie category to decision bit.
        assert!(
            equal_count > 100 && equal_count < 924,
            "equal_count={equal_count}"
        );
    }

    #[test]
    fn test_category_distribution_uniform() {
        let mut counts = [0u32; 6];
        for i in 0u32..6_000 {
            let mut slot_hash = [0u8; 32];
            slot_hash[..4].copy_from_slice(&i.to_le_bytes());
            let category = challenge_category(&slot_hash, u64::from(i), 123) as usize;
            counts[category] += 1;
        }
        for count in counts {
            assert!((700..=1300).contains(&count), "count out of range: {count}");
        }
    }

    #[test]
    fn test_numerical_approx_tolerance() {
        assert!(verify_response(
            ChallengeCategory::NumericalApprox,
            "1.001",
            "1.000"
        ));
        assert!(!verify_response(
            ChallengeCategory::NumericalApprox,
            "1.002",
            "1.000"
        ));
    }

    #[test]
    fn test_logic_sat_case_insensitive() {
        assert!(verify_response(ChallengeCategory::LogicSat, "sat", "SAT"));
        assert!(verify_response(
            ChallengeCategory::LogicSat,
            "UNSAT",
            "unsat"
        ));
        assert!(!verify_response(
            ChallengeCategory::LogicSat,
            "maybe",
            "SAT"
        ));
    }

    #[test]
    fn test_exactly_six_categories() {
        let categories = [
            ChallengeCategory::MathFormal,
            ChallengeCategory::CodeExecution,
            ChallengeCategory::LogicSat,
            ChallengeCategory::FactualOnchain,
            ChallengeCategory::CryptoVerify,
            ChallengeCategory::NumericalApprox,
        ];
        assert_eq!(
            categories.len(),
            6,
            "Challenge category count changed — requires whitepaper amendment"
        );
    }
}

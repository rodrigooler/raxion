//! Stochastic verification - deterministic challenge generation.

use sha2::{Digest, Sha256};

pub const CHALLENGE_CATEGORY_MATH: u8 = 0;
pub const CHALLENGE_CATEGORY_CODE: u8 = 1;
pub const N_DEVNET_CATEGORIES: u8 = 2;

/// Determines whether an inference should be challenged.
/// Formula: challenge_seed = HASH(slot_hash || inf_id || stake_seed)
/// Rule: is_challenged = challenge_seed mod 1000 < rate_per_1000
pub fn should_challenge(
    slot_hash: &[u8; 32],
    inf_id: u64,
    stake_seed: u64,
    rate_per_1000: u16,
) -> bool {
    let seed = compute_challenge_seed(slot_hash, inf_id, stake_seed);
    (seed % 1000) < u64::from(rate_per_1000)
}

/// Determines challenge category independent from challenge decision.
pub fn challenge_category(slot_hash: &[u8; 32], inf_id: u64, stake_seed: u64) -> u8 {
    let seed = compute_challenge_seed(slot_hash, inf_id, stake_seed);
    let mut hasher = Sha256::new();
    hasher.update(seed.to_le_bytes());
    hasher.update(b"category");
    let digest = hasher.finalize();
    let mut first_8 = [0u8; 8];
    first_8.copy_from_slice(&digest[..8]);
    let category_seed = u64::from_le_bytes(first_8);
    (category_seed % u64::from(N_DEVNET_CATEGORIES)) as u8
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
        assert!((rate - 0.015).abs() < 0.005, "rate={} challenged={}", rate, challenged);
    }

    #[test]
    fn test_category_is_in_devnet_range() {
        for inf_id in 0..1024u64 {
            let mut slot_hash = [0u8; 32];
            slot_hash[..8].copy_from_slice(&inf_id.to_le_bytes());
            let category = challenge_category(&slot_hash, inf_id, 123);
            assert!(category == CHALLENGE_CATEGORY_MATH || category == CHALLENGE_CATEGORY_CODE);
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
        assert!((rate - 0.05).abs() < 0.01, "rate={} challenged={}", rate, challenged);
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
        assert!(equal_count > 200 && equal_count < 824, "equal_count={equal_count}");
    }
}

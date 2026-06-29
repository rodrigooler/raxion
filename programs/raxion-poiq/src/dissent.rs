//! RAXION PoIQ — Dissent Queue helpers.

/// Parameters — must match whitepaper and MEMORY.
pub const THETA_CONFIDENCE: f32 = 0.85;
pub const DISSENT_REWARD_MULTIPLIER: f32 = 2.0;

/// Challenge response deadline in slots (~225 seconds at ~2 slots/sec).
pub const CHALLENGE_DEADLINE_SLOTS: u64 = 450;

/// Determine whether an inference qualifies for dissent queue.
pub fn qualifies_for_dissent(coherence_score: f32, max_internal_confidence: f32) -> bool {
    let below_standard = coherence_score < 0.60;
    let above_rejection = coherence_score >= 0.30;
    let high_confidence = max_internal_confidence >= THETA_CONFIDENCE;
    below_standard && above_rejection && high_confidence
}

/// Check if a challenge has expired (agent did not respond in time).
pub fn is_expired(raised_at_slot: u64, current_slot: u64) -> bool {
    current_slot.saturating_sub(raised_at_slot) > CHALLENGE_DEADLINE_SLOTS
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_qualifies_for_dissent_correct_range() {
        assert!(qualifies_for_dissent(0.45, 0.90));
    }

    #[test]
    fn test_complete_rejection_does_not_dissent() {
        assert!(!qualifies_for_dissent(0.20, 0.95));
    }

    #[test]
    fn test_standard_convergence_does_not_dissent() {
        assert!(!qualifies_for_dissent(0.70, 0.95));
    }

    #[test]
    fn test_low_confidence_does_not_dissent() {
        assert!(!qualifies_for_dissent(0.50, 0.70));
    }

    #[test]
    fn test_not_expired_within_deadline() {
        assert!(!is_expired(100, 500));
    }

    #[test]
    fn test_expired_after_deadline() {
        assert!(is_expired(100, 551));
    }

    #[test]
    fn test_exactly_at_deadline_not_expired() {
        assert!(!is_expired(100, 550));
    }

    #[test]
    fn test_theta_confidence_invariant() {
        assert!(
            (THETA_CONFIDENCE - 0.85).abs() < 1e-6,
            "theta_confidence changed — requires whitepaper amendment"
        );
    }
}

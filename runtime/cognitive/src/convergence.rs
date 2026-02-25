//! Convergence helpers for runtime integration.

/// Whitepaper-locked CoherenceScore weights.
pub const ALPHA: f32 = 0.4;
pub const BETA: f32 = 0.6;

pub const THRESHOLD_REJECT: f32 = 0.30;
pub const THRESHOLD_STANDARD: f32 = 0.60;
pub const THRESHOLD_HIGH: f32 = 0.85;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConvergenceCategory {
    Rejected,
    LowConfidence,
    Standard,
    HighCoherence,
}

pub fn categorize(score: f32) -> ConvergenceCategory {
    if score < THRESHOLD_REJECT {
        ConvergenceCategory::Rejected
    } else if score < THRESHOLD_STANDARD {
        ConvergenceCategory::LowConfidence
    } else if score < THRESHOLD_HIGH {
        ConvergenceCategory::Standard
    } else {
        ConvergenceCategory::HighCoherence
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_threshold_categorization() {
        assert_eq!(categorize(0.10), ConvergenceCategory::Rejected);
        assert_eq!(categorize(0.40), ConvergenceCategory::LowConfidence);
        assert_eq!(categorize(0.70), ConvergenceCategory::Standard);
        assert_eq!(categorize(0.90), ConvergenceCategory::HighCoherence);
    }

    #[test]
    fn test_alpha_beta_sum_to_one() {
        assert!((ALPHA + BETA - 1.0).abs() < 1e-9);
    }
}

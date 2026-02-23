//! Rust mirror of PoC CoherenceScore formulas (Phase 0).

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConvergenceCategory {
    Rejected,
    LowConfidence,
    Standard,
    HighCoherence,
}

#[derive(Debug, Clone, Copy)]
pub struct CoherenceResult {
    pub score: f64,
    pub category: ConvergenceCategory,
    pub cs_semantic: f64,
    pub cc_approximate: f64,
    pub sim_ts: f64,
    pub sim_tn: f64,
    pub sim_sn: f64,
}

pub const ALPHA: f64 = 0.4;
pub const BETA: f64 = 0.6;
pub const W_PREMISE: f64 = 0.3;
pub const W_CONCLUSION: f64 = 0.5;
pub const W_ENTAILMENT: f64 = 0.2;

pub const THRESHOLD_REJECT: f64 = 0.30;
pub const THRESHOLD_STANDARD: f64 = 0.60;
pub const THRESHOLD_HIGH: f64 = 0.85;

fn clamp01(value: f64) -> f64 {
    value.clamp(0.0, 1.0)
}

pub fn geometric_mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    if values.iter().any(|v| *v <= 0.0) {
        return 0.0;
    }

    let ln_sum: f64 = values.iter().map(|v| v.ln()).sum();
    (ln_sum / values.len() as f64).exp()
}

/// Approximate CC from a normalized agreement signal in [0, 1].
pub fn approximate_cc_from_agreement(conclusion_agreement: f64) -> f64 {
    let agreement = clamp01(conclusion_agreement);
    clamp01(W_PREMISE * agreement + W_CONCLUSION * agreement + W_ENTAILMENT * agreement)
}

pub fn category_for_score(score: f64) -> ConvergenceCategory {
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

/// Compute final CoherenceScore from pairwise semantic similarities and CC.
pub fn compute_coherence_from_components(
    sim_ts: f64,
    sim_tn: f64,
    sim_sn: f64,
    cc_approximate: f64,
) -> CoherenceResult {
    let sim_ts = clamp01(sim_ts);
    let sim_tn = clamp01(sim_tn);
    let sim_sn = clamp01(sim_sn);
    let cc = clamp01(cc_approximate);

    let cs_semantic = geometric_mean(&[sim_ts, sim_tn, sim_sn]);
    let score = clamp01(ALPHA * cs_semantic + BETA * cc);
    let category = category_for_score(score);

    CoherenceResult {
        score,
        category,
        cs_semantic,
        cc_approximate: cc,
        sim_ts,
        sim_tn,
        sim_sn,
    }
}

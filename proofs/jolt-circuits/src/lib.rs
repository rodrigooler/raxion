//! RAXION Jolt Quality Proof (pi_quality) scaffold for Testnet prep.
//!
//! This crate mirrors the coherence computation path used by PoIQ Layer 1.

use serde::{Deserialize, Serialize};

/// Protocol formula: CC = 0.3*consistency + 0.5*agreement + 0.2*entailment_rate
/// See: whitepaper Chapter 3, Definition 3
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityOutput {
    pub score: f32,
    pub cs_semantic: f32,
    pub cc: f32,
    /// SAFETY: is_final requires challenge-lifecycle resolution.
    /// Do NOT set from score alone - only set true after challenge completes.
    pub is_final: bool,
}

/// Compute cosine similarity normalized to [0, 1] range.
fn cosine_similarity_norm(a: &[f32], b: &[f32]) -> f32 {
    assert_eq!(a.len(), b.len());
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    ((dot + 1.0) / 2.0).clamp(0.0, 1.0)
}

/// Protocol formula: CS_semantic = (sim(T,S) × sim(T,N) × sim(S,N))^(1/3)
/// See: whitepaper Chapter 3, Definition 2
pub fn semantic_convergence_score(
    emb_t: &[f32],
    emb_s: &[f32],
    emb_n: &[f32],
) -> f32 {
    let sim_ts = cosine_similarity_norm(emb_t, emb_s);
    let sim_tn = cosine_similarity_norm(emb_t, emb_n);
    let sim_sn = cosine_similarity_norm(emb_s, emb_n);

    if sim_ts > 0.0 && sim_tn > 0.0 && sim_sn > 0.0 {
        (sim_ts * sim_tn * sim_sn).powf(1.0 / 3.0)
    } else {
        0.0
    }
}

/// Calculate Coherence Score using protocol formula:
/// CoherenceScore = 0.4×CS_semantic + 0.6×CC
/// See: whitepaper Chapter 3, Definition 4
///
/// # Arguments
/// * `emb_t` - Transformer embedding
/// * `emb_s` - SSM embedding
/// * `emb_n` - Neuro-symbolic embedding
/// * `consistency` - Consistency component (0.3 weight in CC)
/// * `agreement` - Agreement component (0.5 weight in CC)
/// * `entailment_rate` - Entailment rate (0.2 weight in CC)
pub fn prove_coherence_score(
    emb_t: &[f32],
    emb_s: &[f32],
    emb_n: &[f32],
    consistency: f32,
    agreement: f32,
    entailment_rate: f32,
) -> QualityOutput {
    let cs_semantic = semantic_convergence_score(emb_t, emb_s, emb_n);

    // Protocol formula: CC = 0.3*consistency + 0.5*agreement + 0.2*entailment_rate
    // See: whitepaper Chapter 3, Definition 3
    let cc = 0.3_f32.mul_add(consistency, 0.5_f32.mul_add(agreement, 0.2 * entailment_rate));

    // Protocol formula: CoherenceScore = 0.4×CS_semantic + 0.6×CC
    let score = (0.4 * cs_semantic + 0.6 * cc).clamp(0.0, 1.0);

    // SAFETY: Do NOT mark final from score alone.
    // is_final requires challenge-lifecycle resolution.
    // Callers must set is_final = true only after challenge completes.
    let is_final = false;

    QualityOutput {
        score,
        cs_semantic,
        cc,
        is_final,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quality_output_bounds() {
        let emb_t = vec![1.0, 0.0, 0.0];
        let emb_s = vec![1.0, 0.0, 0.0];
        let emb_n = vec![1.0, 0.0, 0.0];
        // Protocol formula requires consistency, agreement, entailment_rate
        let out = prove_coherence_score(&emb_t, &emb_s, &emb_n, 0.8, 0.9, 0.7);
        assert!((0.0..=1.0).contains(&out.score));
        assert!((0.0..=1.0).contains(&out.cs_semantic));
        assert!((0.0..=1.0).contains(&out.cc));
    }

    #[test]
    fn test_is_final_default_false() {
        let emb_t = vec![1.0, 0.0, 0.0];
        let emb_s = vec![1.0, 0.0, 0.0];
        let emb_n = vec![1.0, 0.0, 0.0];
        let out = prove_coherence_score(&emb_t, &emb_s, &emb_n, 0.8, 0.9, 0.7);
        // is_final must be false until challenge lifecycle completes
        assert!(!out.is_final);
    }

    #[test]
    fn test_semantic_convergence_score() {
        let emb_t = vec![1.0, 0.0, 0.0];
        let emb_s = vec![1.0, 0.0, 0.0];
        let emb_n = vec![1.0, 0.0, 0.0];
        let cs = semantic_convergence_score(&emb_t, &emb_s, &emb_n);
        // Perfect similarity should give CS = 1.0
        assert!((cs - 1.0).abs() < 0.001);
    }
}

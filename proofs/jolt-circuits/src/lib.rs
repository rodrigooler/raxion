//! RAXION Jolt Quality Proof (pi_quality) scaffold for Testnet prep.
//!
//! This crate mirrors the coherence computation path used by PoIQ Layer 1.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityOutput {
    pub score: f32,
    pub cs_semantic: f32,
    pub cc: f32,
    pub is_final: bool,
}

pub fn cosine_similarity_norm(a: &[f32], b: &[f32]) -> f32 {
    assert_eq!(a.len(), b.len());
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    ((dot + 1.0) / 2.0).clamp(0.0, 1.0)
}

pub fn prove_coherence_score(emb_t: &[f32], emb_s: &[f32], emb_n: &[f32]) -> QualityOutput {
    let sim_ts = cosine_similarity_norm(emb_t, emb_s);
    let sim_tn = cosine_similarity_norm(emb_t, emb_n);
    let sim_sn = cosine_similarity_norm(emb_s, emb_n);

    let cs_semantic = if sim_ts > 0.0 && sim_tn > 0.0 && sim_sn > 0.0 {
        (sim_ts * sim_tn * sim_sn).powf(1.0 / 3.0)
    } else {
        0.0
    };

    let cc = 0.8 * sim_ts + 0.14;
    let score = (0.4 * cs_semantic + 0.6 * cc).clamp(0.0, 1.0);
    let is_final = score >= 0.60;

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
        let out = prove_coherence_score(&emb_t, &emb_s, &emb_n);
        assert!((0.0..=1.0).contains(&out.score));
        assert!((0.0..=1.0).contains(&out.cs_semantic));
    }
}

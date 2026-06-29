use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceRequest {
    pub query: String,
    pub inference_id: u64,
    pub context: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceResult {
    pub inference_id: u64,
    pub response: String,
    pub coherence_score: f32,
    pub category: &'static str,
    pub is_final: bool,
    pub tx_signature: Option<String>,
}

pub fn categorize(score: f32) -> &'static str {
    if score < 0.30 { "REJECTED" }
    else if score < 0.60 { "LOW_CONFIDENCE" }
    else if score < 0.85 { "STANDARD" }
    else { "HIGH_COHERENCE" }
}

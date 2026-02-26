use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceRequest {
    pub query: String,
    pub inference_id: u64,
    pub context: Option<String>,
}

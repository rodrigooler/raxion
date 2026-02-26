use anyhow::Result;

#[derive(Debug, Clone, Default)]
pub struct AgentMemory {
    pub agent_pubkey: String,
    pub reliability_score: f32,
    pub inference_count: u64,
}

impl AgentMemory {
    pub async fn recall(&self, _query: &str, _top_k: usize) -> Result<Vec<String>> {
        Ok(vec![])
    }

    pub async fn store(&self, key: &str, value: &str) -> Result<()> {
        log::info!("[Memory] Store: key={} value_len={}", key, value.chars().count());
        Ok(())
    }
}

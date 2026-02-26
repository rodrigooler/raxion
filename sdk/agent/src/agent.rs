use async_trait::async_trait;

use crate::inference::InferenceRequest;
use crate::memory::AgentMemory;

#[async_trait]
pub trait SmartAgent: Send + Sync {
    fn name(&self) -> &str;
    fn architecture_type(&self) -> &str;

    async fn respond(
        &self,
        request: &InferenceRequest,
        memory: &AgentMemory,
    ) -> anyhow::Result<String>;

    async fn respond_to_challenge(
        &self,
        challenge_type: &str,
        challenge_content: &str,
    ) -> anyhow::Result<Option<String>> {
        let _ = (challenge_type, challenge_content);
        Ok(None)
    }
}

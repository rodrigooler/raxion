use std::time::Duration;

use anyhow::Result;
use tokio::time::sleep;

use crate::{AgentMemory, InferenceRequest, SmartAgent};

pub struct AgentRunner<A: SmartAgent> {
    agent: A,
    endpoint: String,
}

impl<A: SmartAgent> AgentRunner<A> {
    pub fn new(agent: A) -> Self {
        Self {
            agent,
            endpoint: "http://localhost:11434".to_owned(),
        }
    }

    pub fn with_devnet(mut self) -> Self {
        self.endpoint = "https://devnet.raxion.network".to_owned();
        self
    }

    pub fn with_endpoint(mut self, endpoint: impl Into<String>) -> Self {
        self.endpoint = endpoint.into();
        self
    }

    pub async fn run(self) -> Result<()> {
        let memory = AgentMemory {
            agent_pubkey: "devnet-agent".to_owned(),
            reliability_score: 0.80,
            inference_count: 0,
        };

        println!("[RAXION SDK] Agent: {}", self.agent.name());
        println!("[RAXION SDK] Architecture: {}", self.agent.architecture_type());
        println!("[RAXION SDK] Endpoint: {}", self.endpoint);

        // Devnet v0.1 runner stub: executes a single bootstrap query.
        let request = InferenceRequest {
            query: "Devnet bootstrap healthcheck".to_owned(),
            inference_id: 1,
            context: None,
        };

        let response = self.agent.respond(&request, &memory).await?;
        println!("[RAXION SDK] Bootstrap response: {}", response);

        sleep(Duration::from_millis(200)).await;
        Ok(())
    }
}

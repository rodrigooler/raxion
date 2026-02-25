use async_trait::async_trait;
use raxion_sdk::{AgentMemory, AgentRunner, InferenceRequest, SmartAgent};

struct CodeAgent {
    ollama_endpoint: String,
}

#[async_trait]
impl SmartAgent for CodeAgent {
    fn name(&self) -> &str {
        "code-agent-v01"
    }

    fn architecture_type(&self) -> &str {
        "transformer"
    }

    async fn respond(
        &self,
        request: &InferenceRequest,
        _memory: &AgentMemory,
    ) -> anyhow::Result<String> {
        let system = "You are a deterministic code-analysis agent. \
            Return direct technical answers with complexity and edge cases.";

        let client = reqwest::Client::new();
        let body = serde_json::json!({
            "model": "llama3.1:8b",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": &request.query}
            ],
            "stream": false,
            "options": {"temperature": 0.0}
        });

        let response: serde_json::Value = client
            .post(format!("{}/api/chat", self.ollama_endpoint))
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        Ok(response["message"]["content"]
            .as_str()
            .unwrap_or("")
            .trim()
            .to_owned())
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let agent = CodeAgent {
        ollama_endpoint: "http://localhost:11434".to_owned(),
    };

    AgentRunner::new(agent).with_devnet().run().await
}

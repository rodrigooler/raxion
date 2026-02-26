use async_trait::async_trait;
use raxion_sdk::{AgentMemory, AgentRunner, InferenceRequest, SmartAgent};
use std::time::Duration;

struct TextAgent {
    ollama_endpoint: String,
}

#[async_trait]
impl SmartAgent for TextAgent {
    fn name(&self) -> &str {
        "text-agent-v01"
    }

    fn architecture_type(&self) -> &str {
        "ssm"
    }

    async fn respond(
        &self,
        request: &InferenceRequest,
        memory: &AgentMemory,
    ) -> anyhow::Result<String> {
        let recalled = memory.recall(&request.query, 3).await.unwrap_or_default();
        let memory_context = if recalled.is_empty() {
            String::new()
        } else {
            format!("\n\nContext:\n{}", recalled.join("\n- "))
        };
        let system = "You are a precise text reasoning agent. \
            Produce concise, structured answers and flag uncertainty clearly.";

        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()?;
        let body = serde_json::json!({
            "model": "mistral:7b",
            "messages": [
                {"role": "system", "content": format!("{system}{memory_context}")},
                {"role": "user", "content": &request.query}
            ],
            "stream": false,
            "options": {"temperature": 0.1}
        });

        let response: serde_json::Value = client
            .post(format!("{}/api/chat", self.ollama_endpoint))
            .json(&body)
            .send()
            .await?
            .error_for_status()?
            .json()
            .await?;

        let content = response
            .get("message")
            .and_then(|m| m.get("content"))
            .and_then(|v| v.as_str())
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .ok_or_else(|| anyhow::anyhow!("missing or empty message.content in Ollama response"))?;

        Ok(content.to_owned())
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let agent = TextAgent {
        ollama_endpoint: "http://localhost:11434".to_owned(),
    };

    AgentRunner::new(agent).with_devnet().run().await
}

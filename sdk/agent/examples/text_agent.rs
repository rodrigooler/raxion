use async_trait::async_trait;
use raxion_sdk::{AgentMemory, AgentRunner, InferenceRequest, SmartAgent};

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
        _memory: &AgentMemory,
    ) -> anyhow::Result<String> {
        let system = "You are a precise text reasoning agent. \
            Produce concise, structured answers and flag uncertainty clearly.";

        let client = reqwest::Client::new();
        let body = serde_json::json!({
            "model": "mistral:7b",
            "messages": [
                {"role": "system", "content": system},
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
    let agent = TextAgent {
        ollama_endpoint: "http://localhost:11434".to_owned(),
    };

    AgentRunner::new(agent).with_devnet().run().await
}

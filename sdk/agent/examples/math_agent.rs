use async_trait::async_trait;
use raxion_sdk::{AgentMemory, AgentRunner, InferenceRequest, SmartAgent};
use std::time::Duration;

struct MathAgent {
    ollama_endpoint: String,
}

#[async_trait]
impl SmartAgent for MathAgent {
    fn name(&self) -> &str {
        "math-agent-v01"
    }

    fn architecture_type(&self) -> &str {
        "transformer"
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
        let system = "You are a mathematical reasoning agent. \
            For every claim, provide formal justification. \
            If a problem has no solution, prove impossibility. \
            Never guess; flag uncertainty explicitly.";

        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()?;
        let body = serde_json::json!({
            "model": "llama3.1:8b",
            "messages": [
                {"role": "system", "content": format!("{system}{memory_context}")},
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

    async fn respond_to_challenge(
        &self,
        challenge_type: &str,
        challenge_content: &str,
    ) -> anyhow::Result<Option<String>> {
        if challenge_type == "MATH_FORMAL" {
            let response = self
                .respond(
                    &InferenceRequest {
                        query: challenge_content.to_owned(),
                        inference_id: 0,
                        context: None,
                    },
                    &AgentMemory::default(),
                )
                .await?;
            return Ok(Some(response));
        }
        Ok(None)
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let agent = MathAgent {
        ollama_endpoint: "http://localhost:11434".to_owned(),
    };

    println!("Starting RAXION Math Agent on Devnet...");
    println!("Architecture: {}", agent.architecture_type());

    AgentRunner::new(agent).with_devnet().run().await
}

use async_trait::async_trait;
use raxion_sdk::{AgentMemory, AgentRunner, InferenceRequest, SmartAgent};
use std::time::Duration;

struct ApiAgent {
    api_url: String,
    api_key: Option<String>,
}

#[async_trait]
impl SmartAgent for ApiAgent {
    fn name(&self) -> &str {
        "api-agent-v01"
    }

    fn architecture_type(&self) -> &str {
        "transformer"
    }

    async fn respond(
        &self,
        request: &InferenceRequest,
        _memory: &AgentMemory,
    ) -> anyhow::Result<String> {
        let Some(key) = &self.api_key else {
            return Ok(format!(
                "Mock response for: {}. Set RAXION_API_KEY to use a real LLM.",
                request.query
            ));
        };

        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(60))
            .build()?;

        let body = serde_json::json!({
            "model": std::env::var("RAXION_API_MODEL").unwrap_or_else(|_| "gpt-4o-mini".into()),
            "messages": [
                {"role": "system", "content": "You are a RAXION Smart Agent. Answer concisely."},
                {"role": "user", "content": &request.query}
            ],
            "temperature": 0.0
        });

        let res: serde_json::Value = client
            .post(&self.api_url)
            .bearer_auth(key)
            .json(&body)
            .send()
            .await?
            .error_for_status()?
            .json()
            .await?;

        res["choices"][0]["message"]["content"]
            .as_str()
            .map(|s| s.trim().to_owned())
            .ok_or_else(|| anyhow::anyhow!("unexpected API response shape"))
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let api_url = std::env::var("RAXION_API_URL")
        .unwrap_or_else(|_| "https://api.openai.com/v1/chat/completions".into());
    let api_key = std::env::var("RAXION_API_KEY").ok();

    if api_key.is_none() {
        println!("[api_agent] No RAXION_API_KEY set, running in mock mode.");
    }

    let agent = ApiAgent { api_url, api_key };
    AgentRunner::new(agent).with_devnet().run().await
}

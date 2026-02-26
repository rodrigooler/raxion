//! CognitiveScheduler v0.1 - Parallel inference thread dispatcher.

use std::collections::HashSet;
use std::time::{Duration, Instant};

use serde_json::Value;
use thiserror::Error;
use tokio::task::JoinHandle;

use crate::account_types::CognitiveAccount;

pub const MAX_DEVNET_THREADS: usize = 8;
pub const THREAD_TIMEOUT_SECS: u64 = 120;

pub const ARCH_TRANSFORMER: &str = "transformer";
pub const ARCH_SSM: &str = "ssm";
pub const ARCH_NEUROSYMBOLIC: &str = "neurosymbolic";

#[derive(Debug, Clone)]
pub struct QueryInput {
    pub text: String,
    pub inference_id: u64,
    pub context: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ThreadOutput {
    pub architecture: String,
    pub model_id: String,
    pub output: String,
    pub output_hash: [u8; 32],
    pub latency_ms: u64,
    pub thread_index: usize,
}

#[derive(Debug, Clone)]
pub struct SchedulerResult {
    pub outputs: Vec<ThreadOutput>,
    pub timeouts: usize,
    pub total_latency_ms: u64,
}

impl SchedulerResult {
    pub fn has_minimum_outputs(&self) -> bool {
        if self.outputs.len() < 2 {
            return false;
        }
        let unique_archs: HashSet<&str> = self
            .outputs
            .iter()
            .map(|output| output.architecture.as_str())
            .collect();
        unique_archs.len() >= 2
    }
}

pub struct CognitiveScheduler {
    pub architectures: Vec<ArchitectureEndpoint>,
}

#[derive(Debug, Clone)]
pub struct ArchitectureEndpoint {
    pub architecture_type: String,
    pub model_id: String,
    pub endpoint: String,
}

impl CognitiveScheduler {
    pub fn new(architectures: Vec<ArchitectureEndpoint>) -> Self {
        Self { architectures }
    }

    pub fn thread_count(&self, agent: &CognitiveAccount) -> usize {
        let agent_max = agent.max_threads() as usize;
        let available = self.architectures.len();
        agent_max.min(available).min(MAX_DEVNET_THREADS)
    }

    pub async fn dispatch(
        &self,
        query: QueryInput,
        agent: &CognitiveAccount,
    ) -> Result<SchedulerResult, SchedulerError> {
        let n_threads = self.thread_count(agent);
        if n_threads == 0 {
            return Err(SchedulerError::NoArchitecturesAvailable);
        }

        let start = Instant::now();
        let timeout = Duration::from_secs(THREAD_TIMEOUT_SECS);

        let handles: Vec<JoinHandle<Result<ThreadOutput, ThreadError>>> = self
            .architectures
            .iter()
            .take(n_threads)
            .enumerate()
            .map(|(index, endpoint)| {
                let query_clone = query.clone();
                let endpoint_clone = endpoint.clone();
                tokio::spawn(async move {
                    run_inference_thread(index, query_clone, endpoint_clone).await
                })
            })
            .collect();

        let mut outputs = Vec::new();
        let mut timeouts = 0;

        for handle in handles {
            match tokio::time::timeout(timeout, handle).await {
                Ok(Ok(Ok(output))) => outputs.push(output),
                Ok(Ok(Err(error))) => {
                    log::warn!("thread inference error: {}", error);
                }
                Ok(Err(error)) => {
                    log::error!("thread join error: {}", error);
                }
                Err(_) => {
                    log::warn!("thread timed out after {}s", THREAD_TIMEOUT_SECS);
                    timeouts += 1;
                }
            }
        }

        if outputs.is_empty() {
            return Err(SchedulerError::AllThreadsFailed);
        }

        let total_latency_ms = start.elapsed().as_millis() as u64;
        Ok(SchedulerResult {
            outputs,
            timeouts,
            total_latency_ms,
        })
    }
}

async fn run_inference_thread(
    thread_index: usize,
    query: QueryInput,
    endpoint: ArchitectureEndpoint,
) -> Result<ThreadOutput, ThreadError> {
    use sha2::{Digest, Sha256};

    let start = Instant::now();

    let response = call_ollama_inference(
        &endpoint.endpoint,
        &endpoint.model_id,
        &query.text,
        query.context.as_deref(),
    )
    .await?;

    let latency_ms = start.elapsed().as_millis() as u64;
    let mut hasher = Sha256::new();
    hasher.update(response.as_bytes());
    let output_hash: [u8; 32] = hasher.finalize().into();

    Ok(ThreadOutput {
        architecture: endpoint.architecture_type,
        model_id: endpoint.model_id,
        output: response,
        output_hash,
        latency_ms,
        thread_index,
    })
}

async fn call_ollama_inference(
    endpoint: &str,
    model_id: &str,
    query: &str,
    context: Option<&str>,
) -> Result<String, ThreadError> {
    let client = reqwest::Client::new();

    let system_prompt = match context {
        Some(ctx) => format!("You are a precise reasoning agent.\n\nContext:\n{}", ctx),
        None => "You are a precise reasoning agent. Answer directly and concisely.".to_string(),
    };

    let body = serde_json::json!({
        "model": model_id,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ],
        "stream": false,
        "options": {"temperature": 0.1, "num_predict": 512}
    });

    let response = client
        .post(endpoint)
        .json(&body)
        .send()
        .await
        .map_err(|err| ThreadError::InferenceFailed(err.to_string()))?;

    let value: Value = response
        .json()
        .await
        .map_err(|err| ThreadError::InferenceFailed(err.to_string()))?;

    let content = value
        .get("message")
        .and_then(|m| m.get("content"))
        .and_then(Value::as_str)
        .ok_or_else(|| ThreadError::InvalidResponse("missing message.content".to_string()))?;

    Ok(content.trim().to_string())
}

#[derive(Debug, Error)]
pub enum SchedulerError {
    #[error("No architectures registered")]
    NoArchitecturesAvailable,

    #[error("All inference threads failed or timed out")]
    AllThreadsFailed,

    #[error("Insufficient outputs for convergence: need 2, got {got}")]
    InsufficientOutputs { got: usize },
}

#[derive(Debug, Error)]
pub enum ThreadError {
    #[error("Inference failed: {0}")]
    InferenceFailed(String),

    #[error("Invalid inference response: {0}")]
    InvalidResponse(String),
}

#[cfg(test)]
mod tests {
    use solana_sdk::pubkey::Pubkey;

    use super::*;

    fn make_agent(stake_rax: u64) -> CognitiveAccount {
        CognitiveAccount::new(Pubkey::new_unique(), stake_rax, "transformer")
            .expect("agent should build")
    }

    fn make_scheduler(n: usize) -> CognitiveScheduler {
        let archs: Vec<ArchitectureEndpoint> = (0..n)
            .map(|i| ArchitectureEndpoint {
                architecture_type: format!("arch_{}", i),
                model_id: format!("model_{}", i),
                endpoint: format!("http://localhost:{}/api/chat", 11434 + i),
            })
            .collect();
        CognitiveScheduler::new(archs)
    }

    #[test]
    fn test_thread_count_capped_at_devnet_max() {
        let scheduler = make_scheduler(20);
        let agent = make_agent(10_000_000);
        assert!(scheduler.thread_count(&agent) <= MAX_DEVNET_THREADS);
    }

    #[test]
    fn test_thread_count_limited_by_architectures() {
        let scheduler = make_scheduler(2);
        let agent = make_agent(100_000);
        assert_eq!(scheduler.thread_count(&agent), 2);
    }

    #[test]
    fn test_thread_count_limited_by_stake() {
        let scheduler = make_scheduler(8);
        let agent = make_agent(1_000);
        assert_eq!(scheduler.thread_count(&agent), 1);
    }

    #[test]
    fn test_scheduler_result_minimum_outputs() {
        let outputs = vec![
            ThreadOutput {
                architecture: "transformer".to_string(),
                model_id: "test".to_string(),
                output: "output 1".to_string(),
                output_hash: [0u8; 32],
                latency_ms: 100,
                thread_index: 0,
            },
            ThreadOutput {
                architecture: "ssm".to_string(),
                model_id: "test".to_string(),
                output: "output 2".to_string(),
                output_hash: [1u8; 32],
                latency_ms: 120,
                thread_index: 1,
            },
        ];
        let result = SchedulerResult {
            outputs,
            timeouts: 0,
            total_latency_ms: 150,
        };
        assert!(result.has_minimum_outputs());
    }

    #[test]
    fn test_scheduler_result_same_arch_not_sufficient() {
        let outputs = vec![
            ThreadOutput {
                architecture: "transformer".to_string(),
                model_id: "model_a".to_string(),
                output: "output 1".to_string(),
                output_hash: [0u8; 32],
                latency_ms: 100,
                thread_index: 0,
            },
            ThreadOutput {
                architecture: "transformer".to_string(),
                model_id: "model_b".to_string(),
                output: "output 2".to_string(),
                output_hash: [1u8; 32],
                latency_ms: 120,
                thread_index: 1,
            },
        ];
        let result = SchedulerResult {
            outputs,
            timeouts: 0,
            total_latency_ms: 150,
        };
        assert!(!result.has_minimum_outputs());
    }
}

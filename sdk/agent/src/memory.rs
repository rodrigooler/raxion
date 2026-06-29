use std::collections::HashMap;
use std::sync::Mutex;

use anyhow::Result;

#[derive(Debug)]
pub struct AgentMemory {
    pub agent_pubkey: String,
    pub reliability_score: f32,
    pub inference_count: u64,
    // ponytail: in-memory HashMap, upgrade to persistent store when needed
    store: Mutex<HashMap<String, String>>,
}

impl Default for AgentMemory {
    fn default() -> Self {
        Self {
            agent_pubkey: String::new(),
            reliability_score: 0.80,
            inference_count: 0,
            store: Mutex::new(HashMap::new()),
        }
    }
}

impl Clone for AgentMemory {
    fn clone(&self) -> Self {
        Self {
            agent_pubkey: self.agent_pubkey.clone(),
            reliability_score: self.reliability_score,
            inference_count: self.inference_count,
            store: Mutex::new(self.store.lock().unwrap().clone()),
        }
    }
}

impl AgentMemory {
    pub fn new(agent_pubkey: String) -> Self {
        Self {
            agent_pubkey,
            ..Default::default()
        }
    }

    pub async fn recall(&self, query: &str, top_k: usize) -> Result<Vec<String>> {
        let store = self.store.lock().unwrap();
        // ponytail: substring match, upgrade to embedding similarity when needed
        let results: Vec<String> = store
            .iter()
            .filter(|(k, _)| k.contains(query) || query.contains(k.as_str()))
            .take(top_k)
            .map(|(_, v)| v.clone())
            .collect();
        Ok(results)
    }

    pub async fn store(&self, key: &str, value: &str) -> Result<()> {
        self.store
            .lock()
            .unwrap()
            .insert(key.to_owned(), value.to_owned());
        log::info!("[Memory] Stored: key={} len={}", key, value.len());
        Ok(())
    }
}

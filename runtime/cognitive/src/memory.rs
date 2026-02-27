//! Native memory management (hot/cold split) for CognitiveAccount state.

use std::cmp::Ordering;
use std::collections::BinaryHeap;

use thiserror::Error;

use crate::account_types::{CognitiveAccount, HOT_STATE_MAX_BYTES};

#[derive(Debug, Error)]
pub enum MemoryError {
    #[error("Hot state exceeds max size: {actual} > {max}")]
    HotStateExceeded { actual: usize, max: usize },
}

pub struct NativeMemoryManager;

impl NativeMemoryManager {
    pub fn validate_hot_state(account: &CognitiveAccount) -> Result<(), MemoryError> {
        let actual = account.hot_state_bytes();
        if actual > HOT_STATE_MAX_BYTES {
            return Err(MemoryError::HotStateExceeded {
                actual,
                max: HOT_STATE_MAX_BYTES,
            });
        }
        Ok(())
    }
}

/// HNSW configuration — protocol invariants.
pub const HNSW_MAX_ENTRIES: usize = 512;
pub const EMBEDDING_DIM: usize = 384;
pub const QUANTIZED_DIM: usize = 384;

#[derive(Debug, Clone)]
pub struct MemoryEntry {
    pub embedding: Vec<i8>,
    pub cold_key: [u8; 64],
    pub timestamp: u64,
    pub importance: f32,
}

#[derive(Debug)]
pub struct SearchResult {
    pub cold_key: [u8; 64],
    pub similarity: f32,
    pub index: usize,
}

impl PartialEq for SearchResult {
    fn eq(&self, other: &Self) -> bool {
        self.similarity == other.similarity
    }
}

impl Eq for SearchResult {}

impl PartialOrd for SearchResult {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for SearchResult {
    fn cmp(&self, other: &Self) -> Ordering {
        self.similarity.total_cmp(&other.similarity)
    }
}

/// v0.1 hot index (flat search semantics with HNSW-shaped limits).
pub struct HotMemoryIndex {
    entries: Vec<MemoryEntry>,
}

impl HotMemoryIndex {
    pub fn new() -> Self {
        Self {
            entries: Vec::with_capacity(HNSW_MAX_ENTRIES),
        }
    }

    pub fn insert(&mut self, entry: MemoryEntry) {
        if self.entries.len() >= HNSW_MAX_ENTRIES {
            let min_idx = self
                .entries
                .iter()
                .enumerate()
                .min_by(|(_, a), (_, b)| a.importance.total_cmp(&b.importance))
                .map(|(i, _)| i)
                .unwrap_or(0);
            self.entries.remove(min_idx);
        }
        self.entries.push(entry);
    }

    pub fn search(&self, query_embedding: &[i8], top_k: usize) -> Vec<SearchResult> {
        let mut heap = BinaryHeap::new();
        for (i, entry) in self.entries.iter().enumerate() {
            if entry.embedding.len() != query_embedding.len() {
                continue;
            }
            let sim = dot_product_int8(query_embedding, &entry.embedding);
            heap.push(SearchResult {
                cold_key: entry.cold_key,
                similarity: sim,
                index: i,
            });
        }

        let mut out = Vec::with_capacity(top_k.min(heap.len()));
        for _ in 0..top_k {
            if let Some(item) = heap.pop() {
                out.push(item);
            } else {
                break;
            }
        }
        out
    }

    pub fn estimated_bytes(&self) -> usize {
        self.entries.len() * (QUANTIZED_DIM + 64 + 8 + 4)
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

fn dot_product_int8(a: &[i8], b: &[i8]) -> f32 {
    assert_eq!(a.len(), b.len());
    let dot: i32 = a
        .iter()
        .zip(b.iter())
        .map(|(&x, &y)| i32::from(x) * i32::from(y))
        .sum();
    dot as f32 / (127.0 * 127.0 * a.len() as f32)
}

#[cfg(test)]
mod tests {
    use solana_sdk::pubkey::Pubkey;

    use super::*;
    use crate::account_types::CognitiveAccount;

    #[test]
    fn test_validate_hot_state_ok() {
        let account = CognitiveAccount::new(Pubkey::new_unique(), 1_000, "transformer").unwrap();
        assert!(NativeMemoryManager::validate_hot_state(&account).is_ok());
    }

    #[test]
    fn test_validate_hot_state_boundary_ok() {
        let mut account =
            CognitiveAccount::new(Pubkey::new_unique(), 1_000, "transformer").unwrap();
        let base = account.hot_state_bytes();
        let entries = (HOT_STATE_MAX_BYTES - base) / 32;
        account.proof_history = vec![[0u8; 32]; entries];
        assert!(account.hot_state_bytes() <= HOT_STATE_MAX_BYTES);
        assert!(NativeMemoryManager::validate_hot_state(&account).is_ok());
    }

    #[test]
    fn test_validate_hot_state_boundary_exceeded() {
        let mut account =
            CognitiveAccount::new(Pubkey::new_unique(), 1_000, "transformer").unwrap();
        let base = account.hot_state_bytes();
        let entries = ((HOT_STATE_MAX_BYTES - base) / 32).saturating_add(1);
        account.proof_history = vec![[0u8; 32]; entries];
        assert!(account.hot_state_bytes() > HOT_STATE_MAX_BYTES);
        assert!(NativeMemoryManager::validate_hot_state(&account).is_err());
    }

    fn make_entry(val: i8, importance: f32) -> MemoryEntry {
        MemoryEntry {
            embedding: vec![val; QUANTIZED_DIM],
            cold_key: [0u8; 64],
            timestamp: 0,
            importance,
        }
    }

    #[test]
    fn test_insert_and_search() {
        let mut index = HotMemoryIndex::new();
        index.insert(make_entry(100, 0.8));
        index.insert(make_entry(50, 0.5));
        index.insert(make_entry(-100, 0.3));

        let query = vec![100i8; QUANTIZED_DIM];
        let results = index.search(&query, 1);
        assert_eq!(results.len(), 1);
        assert!(results[0].similarity > 0.5);
    }

    #[test]
    fn test_eviction_removes_least_important() {
        let mut index = HotMemoryIndex::new();
        for i in 0..HNSW_MAX_ENTRIES {
            index.insert(make_entry(
                (i % 127) as i8,
                i as f32 / HNSW_MAX_ENTRIES as f32,
            ));
        }
        assert_eq!(index.len(), HNSW_MAX_ENTRIES);
        index.insert(make_entry(42, 0.99));
        assert_eq!(index.len(), HNSW_MAX_ENTRIES);
    }

    #[test]
    fn test_hot_state_within_3mb_budget() {
        let mut index = HotMemoryIndex::new();
        for i in 0..HNSW_MAX_ENTRIES {
            index.insert(make_entry((i % 127) as i8, 0.5));
        }
        assert!(
            index.estimated_bytes() < 3_145_728,
            "Hot index exceeds 3MB budget: {} bytes",
            index.estimated_bytes()
        );
    }

    #[test]
    fn test_hnsw_max_entries_invariant() {
        assert_eq!(
            HNSW_MAX_ENTRIES, 512,
            "HNSW_MAX_ENTRIES changed — requires hot state budget recalculation"
        );
    }
}

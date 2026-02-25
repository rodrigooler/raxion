//! Native memory management (hot/cold split) for CognitiveAccount state.

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
}

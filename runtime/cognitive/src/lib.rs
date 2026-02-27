//! RAXION Neural SVM Cognitive Extensions
//!
//! This crate extends the Agave SVM runtime with four primitives:
//! - CognitiveAccount: extended account type with memory + stake + reputation
//! - CognitiveScheduler: parallel inference thread dispatch
//! - NativeMemoryManager: hot/cold state management
//! - ConvergenceEngine: CoherenceScore calculation
//!
//! Phase 1 (Devnet) implements: CognitiveAccount + basic CognitiveScheduler.
//! Phase 2 (Testnet) adds: full convergence engine, GPU proof acceleration.

pub mod account_types;
pub mod convergence;
pub mod memory;
pub mod scheduler;
pub mod state_root;

pub use account_types::{CognitiveAccount, CognitiveAccountError};
pub use scheduler::{CognitiveScheduler, SchedulerError, ThreadOutput};

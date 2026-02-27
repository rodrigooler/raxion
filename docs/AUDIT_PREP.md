# RAXION Security Audit Preparation

## Scope for Audit 1 (Q4 2026)

### In Scope
- `programs/raxion-poiq/` — PoIQ Layer 1, 2, 3 (convergence/challenge/dissent path)
- `programs/raxion-token/` — $RAX genesis and vesting
- `programs/raxion-rollup/` — state-root commitment
- `runtime/cognitive/account_types.rs` — CognitiveAccount state types
- `proofs/risc0-guest/` — zkVM guest program
- `proofs/jolt-circuits/` — quality proof circuits

### Out of Scope (Audit 2)
- RaxLang transpiler
- Explorer/frontend
- Python PoC
- Agent SDK examples

## Pre-Audit Requirements

### Completed before submission
- [x] All TODO comments resolved or documented with rationale
- [x] All `unwrap()` calls replaced with explicit error handling
- [x] Integer arithmetic uses `checked_*` or `saturating_*` in critical paths
- [x] No `unsafe` blocks without safety justification comments
- [x] All account-constraint failures have named error codes
- [x] Event emission on every relevant state change
- [x] Reentrancy/CPI risks reviewed and documented
- [x] Public functions have doc comments with invariants/formulas
- [x] Protocol invariant tests pass (thresholds, parameters, deterministic seeds)

### Known limitations to disclose to auditor
1. `is_final` challenge lifecycle semantics are conservative in Devnet and still evolving.
2. HNSW index is planned as v0.1 correctness-first path before optimized graph search.
3. RaxLang transpiler output is not formally verified.
4. CC in CoherenceScore remains an approximation pending full causal extraction path.

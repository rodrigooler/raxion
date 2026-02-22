## Summary

Implement CoherenceScore in Rust as a mirror of the Python PoC implementation.

## Background

Current implementation exists in:
- `poc/convergence/coherence.py`

We need a Rust mirror to prepare Devnet migration and shared fixtures.

## Requirements

- [ ] Add Rust module implementing:
  - `CS_semantic = geometric_mean(sim_ts, sim_tn, sim_sn)`
  - `CC` approximation for PoC
  - `CoherenceScore = 0.4*CS_semantic + 0.6*CC`
- [ ] Keep protocol constants in named constants (no magic numbers).
- [ ] Add unit tests with known fixtures matching Python outputs.

## Acceptance Criteria

```
✓ Rust results match Python within tolerance
✓ Threshold categories match spec
✓ Tests pass in CI
```

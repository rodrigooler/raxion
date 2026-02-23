## Summary

Benchmark RISC Zero proof generation latency across different input/output sizes for the Phase 0 proof scaffold.

## Scope

- Run `cargo run -p risc0-host` with multiple payload sizes.
- Measure total proof generation and verification time.
- Record hardware profile (CPU, RAM, OS) and config.

## Requirements

- [ ] Add benchmark harness or script under `proofs/`.
- [ ] Test at least 5 payload sizes (small → large).
- [ ] Export results as markdown table and JSON.
- [ ] Document findings in `MEMORY.md` under Q1 benchmark notes.

## Acceptance Criteria

```
✓ Repeatable benchmark command exists
✓ Results table includes size, prove_time_s, verify_time_s
✓ At least one recommendation for Q2 optimization
```

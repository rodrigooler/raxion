# RISC Zero Latency Benchmark (Q1 2026)

Date: 2026-02-23  
Benchmark command:

```bash
python proofs/bench_risc0_latency.py
```

## Scope

- Benchmark target: `risc0-host` proof generation and verification latency.
- Payload sizes: `xs`, `s`, `m`, `l`, `xl` (64/256 up to 1024/4096 bytes).
- Output artifacts:
  - `proofs/benchmarks/risc0_latency_results.json`
  - this markdown report

## Current execution status

The benchmark harness is implemented, but this machine is currently blocked from producing valid latency measurements due to local proving toolchain constraints for RISC Zero on macOS arm64.

Observed blockers while attempting execution:

- Metal toolchain requirement / build toolchain mismatch in native runs.
- Docker workaround on arm64 cannot install `rzup` (`Unsupported architecture: linux/aarch64`) for the required RISC Zero guest toolchain.

## Results table

| size | input_bytes | output_bytes | prove_time_s | verify_time_s | status |
|---|---:|---:|---:|---:|---|
| xs | 64 | 256 | N/A | N/A | blocked |
| s | 128 | 512 | N/A | N/A | blocked |
| m | 256 | 1024 | N/A | N/A | blocked |
| l | 512 | 2048 | N/A | N/A | blocked |
| xl | 1024 | 4096 | N/A | N/A | blocked |

## Q2 Recommendation

- Run the same script in Linux x86_64 CI with preinstalled RISC Zero toolchain and persist measured `prove_time_s` and `verify_time_s` back to `proofs/benchmarks/risc0_latency_results.json`.

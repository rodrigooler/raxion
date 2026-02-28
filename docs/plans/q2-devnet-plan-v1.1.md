# RAXION — Q2 2026 Agent Execution Plan (Devnet) v1.1

Date: 2026-02-25
Scope: Etapa 0 (plan hardening and consistency review before implementation)
Status: Draft for approval

## Goal
Create an execution-safe Q2 plan aligned with `WHITEPAPER.md` v0.4 and `AGENTS.md` invariants, with deterministic gates and non-flaky validation.

## Inconsistencies Found in v0.4
1. Stake/thread formula usage was mixed with lamport-like constants in examples.
2. Challenge-failure slash computation in the sample Anchor code would truncate to zero due to float-to-u64 cast.
3. `scheduler.rs` sample omitted dependencies (`reqwest`, `serde_json`) and used `unwrap()` in library paths.
4. Q1 prerequisite "cargo run -p risc0-host" is not execution-safe on macOS arm64 without explicit fallback and environment flags.
5. Milestone labeling had a task-number mismatch (`Task 0` vs map starting at `Task 1`).

## Whitepaper-Locked Parameters (Source of Truth)
From `WHITEPAPER.md` + `MEMORY.md` active params:

- CoherenceScore:
  - `alpha = 0.4`
  - `beta = 0.6`
  - `theta_reject = 0.30`
  - `theta_standard = 0.60`
  - `theta_high = 0.85`
- Challenge:
  - `challenge_seed = HASH(slot_hash || inf_id || stake_seed)`
  - `is_challenged = seed mod 1000 < 15` (1.5%)
  - Warmup: 5% for first 100 inferences
- Slashing:
  - Trigger 1: `slash_immediate = stake * 0.01 * (1 - CS/0.3)`
  - Trigger 2: `slash_challenge = stake * 0.02 * chronic_multiplier`
  - Trigger 3: `slash_chronic = stake * 0.05` for RS < 0.40 sustained 72h
  - Network cap: 0.1% total stake/hour
- Threads:
  - `max_threads = floor(log2(stake / 1000) * 8) + 1`
  - Reference outputs:
    - `1,000 -> 1`
    - `8,000 -> 25`
    - `100,000 -> 54`
    - `1,000,000 -> 80`

Implementation note:
- Keep internal stake units explicit (`stake_rax` or `stake_units`) and avoid naming as lamports in cognitive runtime formulas.

## Execution Gates (Mandatory Order)
Do not proceed if a gate fails.

1. Gate A: Baseline and prerequisites
2. Gate B: `runtime/cognitive` (account types + scheduler)
3. Gate C: `programs/raxion-poiq` (Layer 1 + Layer 2 categories + Layer 3 triggers)
4. Gate D: RISC0 embedding path + Python/Rust cross-validation
5. Gate E: SDK + reference agents + explorer
6. Gate F: Q2 validation and release checklist

## Gate A — Baseline and Prerequisites
Required checks:
- `pytest poc/tests/test_coherence.py -v`
- `pytest poc/tests/ -v`
- `python poc/run_poc.py --provider mock --mmlu --n 100 --seed 42 --output poc/benchmarks/results/mmlu_100_q2_baseline.json`
- `python poc/validate_q1.py`

Pass criteria:
- Tests green
- MMLU file generated
- `hypothesis_h1_validated` recorded in `MEMORY.md`

If H1 fails (<70%):
- Open issue: `H1 FAILED — convergence below 70% at 100 queries`
- Pause runtime/program implementation until root-cause writeup exists.

## Gate B — runtime/cognitive v0.1
Deliverables:
- `runtime/cognitive` crate scaffolded
- `account_types.rs` + `scheduler.rs` compiling and tested
- No direct Agave source modifications outside `runtime/cognitive/` for v0.1

Hard requirements:
- No `unwrap()` in library code paths
- Thread cap enforced at 8 for Devnet
- Scheduler minimum-output rule requires 2 outputs from different architectures

## Gate C — Anchor PoIQ v0.1
Deliverables:
- `programs/raxion-poiq` implemented with:
  - submit convergence
  - challenge response
  - slashing trigger recording/events

Hard requirements:
- Slash arithmetic must be integer-safe and non-zero when applicable.
- Duplicate `inference_id` must be rejected.
- `// SLASHING:` tags on slashing-related logic for auditability.

## Gate D — RISC0 Embedding Path
Deliverables:
- `proofs/risc0-types` with shared structures and formula helpers
- Guest computes CS_semantic commitment from embedding vectors
- Python/Rust score parity test (`±0.01`) for deterministic fixtures

Hard requirements:
- No whitepaper parameter drift.
- Fallback path documented for environments with local proving limitations.

## Gate E — SDK + Explorer
Deliverables:
- SDK v0.1 (`SmartAgent` trait + memory/inference helpers)
- 3 reference agents (math/code/text)
- Explorer listing convergence events with category coloring

Hard requirements:
- SDK quickstart should be runnable in <30 minutes by external dev.
- Explorer must read real devnet program events (not mock-only).

## Gate F — Q2 Validation
Deliverables:
- `scripts/validate_q2.sh` green
- `MEMORY.md` updated with Q2 outcomes and any parameter decisions
- Devnet announcement checklist completed

## Risk Register (Current)
1. RISC0 local proving/toolchain instability on macOS arm64.
2. Anchor + Solana + Agave version compatibility drift.
3. Scope overload for a single continuous pass without intermediate freeze points.

Mitigations:
- Keep gate-by-gate merges.
- Prefer Linux CI for heavy proving benchmarks.
- Freeze formulas/constants in shared modules with invariant tests.

## Approval Checklist for Etapa 0
- [ ] Whitepaper parameters above confirmed as immutable for Q2
- [ ] Stake unit naming convention confirmed (`stake_rax` vs lamports-like naming)
- [ ] Fallback policy for RISC0 local limitations accepted
- [ ] Proceed to Gate A

# Q2 Devnet Status — 2026-02-25

## Completed in repository

- Agave source fetched on-demand via `scripts/fetch_agave.sh` (pinned upstream ref).
- Cognitive runtime crate present and validated in `runtime/cognitive`.
- Anchor-compatible PoIQ program present in `programs/raxion-poiq`.
- RISC0 type/guest/host embedding path upgraded for Q2 formulas.
- SDK v0.1 with 3 reference agents (`math`, `code`, `text`).
- Devnet explorer app implemented in `apps/explorer/` with real RPC reads.
- Validation scripts available: `scripts/validate_q2.sh` and `scripts/cross_validate_coherence.py`.

## Locally validated

- `scripts/validate_q2.sh` => PASS (11 checks).
- Explorer production build succeeds (`npm run build`).
- SDK examples compile.

## Open items requiring external infrastructure

- Deploy `raxion-poiq` program to Solana devnet and verify event stream with non-placeholder program id.
- Point explorer environment to deployed devnet program id and publish URL (`devnet.raxion.network`).
- Run sustained network criteria (1,000+ live queries, challenge/slashing events).
- Full `risc0-host` prove path on this machine remains constrained by local macOS ARM toolchain (fallback path documented).
- `anchor-cli` local installation failed on this host due LLVM bitcode/linker mismatch (`rustc LLVM21` vs Apple linker `LLVM17`), so deployment should run in Linux CI or standardized container image.

## Whitepaper fidelity notes

- Coherence parameters kept locked: alpha=0.4, beta=0.6, thresholds 0.30/0.60/0.85.
- Deterministic challenge seed implemented as `HASH(slot_hash || inf_id || stake_seed)`.
- Slashing arithmetic uses integer-safe basis-point math (no float truncation-to-zero).
- Trigger 1 (`score < 0.30`) is event-only in Devnet; real debit/redistribution is Testnet scope.
- Inconsistency still pending review: thread formula examples in plan text conflict with direct formula outputs for 100,000 and 1,000,000 stake.

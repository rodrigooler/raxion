# Repository Map

This map reflects the current project layout for Q3 Testnet-prep work.

## Product Surfaces

- `apps/explorer/`: Devnet explorer (public read-only interface for inferences/events).
- `apps/site/`: static marketing/documentation site assets.

## Protocol Core

- `runtime/cognitive/`: RAXION runtime extensions (first-party code only).
- `programs/raxion-poiq/`: Anchor program for PoIQ submission/challenge/slashing flow.
- `programs/raxion-rollup/`: Anchor scaffold for Sovereign Rollup state-root commitments.
- `programs/raxion-token/`: Anchor scaffold for testnet $RAX genesis + vesting.
- `proofs/`: RISC0 guest/host/types and proof-related benchmarks.
- `proofs/jolt-circuits/`: Jolt quality-proof scaffold crate.
- `sdk/agent/`: Rust SDK plus reference agents (`math`, `code`, `text`).
- `sdk/raxlang/`: RaxLang v0.1 parser/transpiler CLI scaffold.
- `poc/`: Q1/Q2 Python PoC and benchmark tooling.

## Operations

- `ops/docker/anchor-devnet/`: pinned Docker image for reproducible Anchor/Solana toolchain.
- `ops/config/deploy/`: deploy environment templates (no secrets).
- `scripts/`: bootstrap, validation, deploy and cross-validation scripts.

## Documentation

- `WHITEPAPER.md`: protocol spec source.
- `docs/whitepaper/`: whitepaper assets and exports.
- `docs/yellowpaper/`: formal proof notes/WIP.
- `docs/reports/`: dated status reports and validation outputs.
- `AGENTS.md`, `CLAUDE.md`, `MEMORY.md`: agent context and persistent decision log.

## Security/Repo Hygiene

- Secrets must never be committed (`id.json`, keypairs, mnemonics, local `.env`).
- Third-party source trees must not be vendored into this repository.
- Build artifacts remain untracked (`target/`, `.next/`, benchmark outputs).

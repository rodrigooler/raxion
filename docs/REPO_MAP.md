# Repository Map

This map reflects the current project layout for Q2 Devnet work.

## Product Surfaces

- `apps/explorer/`: Next.js Devnet explorer (public read-only interface for inferences/events).
- `apps/site/`: static marketing/documentation site assets.

## Protocol Core

- `runtime/cognitive/`: RAXION runtime extensions (first-party code only).
- `programs/raxion-poiq/`: Anchor program for PoIQ submission/challenge/slashing flow.
- `proofs/`: RISC0 guest/host/types and proof-related benchmarks.
- `sdk/agent/`: Rust SDK plus reference agents (`math`, `code`, `text`).
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

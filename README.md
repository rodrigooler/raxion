# RAXION

RAXION is a Sovereign SVM Rollup on Solana focused on one core goal: replace subjective human judgment in decentralized AI with cryptographic verification of inference quality.

Instead of "who voted for this output?", RAXION asks "can this output's quality be mathematically verified?".

## Why RAXION

Most decentralized AI systems still rely on human validators and token-weighted opinion.
RAXION introduces **Proof of Inference Quality (PoIQ)** to make inference quality verifiable and deterministic.

## Whitepaper Highlights

The protocol is organized in three layers:

1. `Layer 1: Statistical Convergence`
Measures epistemic agreement across three architecture classes:
- Transformer
- SSM (State-Space Model)
- Neuro-Symbolic

Core score:

`CoherenceScore = 0.4 × CS_semantic + 0.6 × CC`

2. `Layer 2: Stochastic Verification`
Deterministic challenge selection for a subset of inferences.

3. `Layer 3: Slashing`
Progressive penalties for chronic divergence and low-quality behavior.

Finality target (Cognitive Finality) requires zk execution/quality verification plus minimum coherence threshold.

## Project Status

Current phase: `Phase 1 — Devnet` (Q2 2026), with Q1 foundations preserved.

Q2 scope in this repository now includes:
- Runtime cognitive extensions (`runtime/cognitive`)
- Anchor PoIQ devnet program (`programs/raxion-poiq`)
- RISC0 embedding commitment path (`proofs/`)
- SDK and reference agents (`sdk/agent`)
- Devnet explorer (`apps/explorer`)

Q2 Devnet semantics currently enforced:
- Trigger 1 slashing (`score < 0.30`) is **event-only** in Devnet.
- `is_final` depends on challenge lifecycle, not score alone.
- Deterministic challenge generation is on-chain.

## Quick Start (PoC)

Requirements:
- Python `3.11+`
- `uv` ([install guide](https://docs.astral.sh/uv/getting-started/installation/))

```bash
uv venv --python 3.11 .venv
source .venv/bin/activate
uv pip sync poc/requirements-dev.txt
```

Run deterministic local benchmark (no external model provider):

```bash
uv run poc/run_poc.py --provider mock --n 10 --output poc/benchmarks/results_q1.json
```

Run with OpenRouter models:

```bash
export OPENROUTER_API_KEY="sk-or-..."
uv run poc/run_poc.py --provider openrouter --query "Explain the Oracle Problem in blockchain"
```

## Repository Guide

- `poc/`: Phase 0 Python validation code
- `proofs/`: RISC Zero guest/host scaffolding
- `runtime/cognitive/`: RAXION runtime extensions (Agave base is fetched on demand)
- `programs/raxion-poiq/`: Anchor PoIQ program for Devnet
- `sdk/agent/`: Rust SDK and reference agents
- `apps/explorer/`: Next.js Devnet explorer
- `apps/site/`: static website
- `ops/docker/`: pinned container toolchain for Anchor/Solana workflows
- `ops/config/deploy/`: deploy environment templates
- `WHITEPAPER.md`: protocol whitepaper (v0.4 source at repository root)
- `docs/whitepaper/`: auxiliary whitepaper assets
- `docs/yellowpaper/`: formal protocol proofs (work in progress)
- `AGENTS.md`: core protocol context for contributors and agents
- `MEMORY.md`: project decisions, parameters, and execution notes
- `docs/REPO_MAP.md`: navigability map and ownership by area

## Documentation

- [Whitepaper v0.4](WHITEPAPER.md)
- [Project Context](AGENTS.md)
- [Persistent Decisions](MEMORY.md)
- [Claude Context](CLAUDE.md)

## License

Core protocol: BUSL 1.1, change date `2030-02-20` to MIT.  
SDKs and developer tooling: Apache 2.0.

## Docker Toolchain (Q2 Devnet)

If local macOS toolchains fail to compile Anchor/Solana binaries, use the pinned Docker flow:

```bash
./scripts/docker_anchor_shell.sh
./scripts/docker_deploy_poiq_devnet.sh
```

Image definition:
- `ops/docker/anchor-devnet/Dockerfile`
- `scripts/apply_rust_toolchain_patches.sh` (applies minimal local registry patches for SBF cargo compatibility)

Safe deploy config template:
- `ops/config/deploy/devnet.env.example`

Agave runtime bootstrap (pinned upstream commit):

```bash
./scripts/fetch_agave.sh
```

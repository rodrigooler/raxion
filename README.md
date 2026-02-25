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

Current phase: `Phase 0 — Genesis` (Q1 2026).

Q1 was started in February 2026 and is focused on proving technical viability before runtime-level integration.

### Phase 0 Focus (In Scope)

- Python PoC for convergence between heterogeneous architectures
- CoherenceScore implementation and protocol-invariant tests
- Initial RISC Zero proof-of-execution scaffold
- Contributor onboarding setup (issues, structure, workflows)

### Out of Scope in Phase 0

- Agave runtime fork
- Anchor on-chain programs
- Full PoIQ production implementation
- Tokenomics and mainnet mechanics

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
- `WHITEPAPER.md`: protocol whitepaper (v0.4 source at repository root)
- `docs/whitepaper/`: auxiliary whitepaper assets
- `docs/yellowpaper/`: formal protocol proofs (work in progress)
- `AGENTS.md`: core protocol context for contributors and agents
- `MEMORY.md`: project decisions, parameters, and execution notes

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
- `docker/anchor-devnet/Dockerfile`
- `scripts/apply_rust_toolchain_patches.sh` (applies minimal local registry patches for SBF cargo compatibility)

Safe deploy config template:
- `config/deploy/devnet.env.example`

Agave runtime bootstrap (pinned upstream commit):

```bash
./scripts/fetch_agave.sh
```

# RAXION
# RAXION - Sovereign SVM Rollup for Verifiable AI Inference

> **🚧 Q4 TESTNET PHASE - ACTIVE DEVELOPMENT 🚧**
>
> RAXION is currently in **Phase 4 (Q4 Testnet)** - the public testnet bootstrap phase. The protocol is actively being developed and tested. Breaking changes may occur. For the most up-to-date development status, see our [GitHub Issues](https://github.com/rodrigooler/raxion/issues) and [Milestones](https://github.com/rodrigooler/raxion/milestones).
>
> **Current Milestone**: [M1: Public Testnet Bootstrap](https://github.com/rodrigooler/raxion/milestone/1) - Due May 14, 2026
>
> **Mainnet Launch**: Target Q4 2026 (subject to 90-day testnet stability checkpoint)

---

## Development Status

| Phase | Status | Timeline | Milestone |
|-------|--------|----------|-----------|
| Q1: Genesis | ✅ Complete | Q1 2026 | Whitepaper, Python PoC, RISC Zero basic integration |
| Q2: Devnet | ✅ Complete | Q2-Q3 2026 | Agave integration, PoIQ v0.1, Agent SDK v0.1 |
| Q3: Internal Testing | ✅ Complete | Q3 2026 | 12/15 tests passed, code review fixes |
| **Q4: Public Testnet** | 🔴 **Active** | Q4 2026 | See [Milestones](https://github.com/rodrigooler/raxion/milestones) |

---

## ⚠️ Disclaimer

**THIS PROJECT IS IN ACTIVE DEVELOPMENT.**

- ⚠️ **No Mainnet**: RAXION has **NOT launched on mainnet**. All current deployments are on Solana **devnet or testnet**.
- ⚠️ **Test Tokens Only**: The $RAX token on testnet has **no real value**. It is for testing purposes only.
- ⚠️ **Breaking Changes**: The protocol specification may change. Smart contracts are not yet audited.
- ⚠️ **No Financial Advice**: This is a research and development project. Do not make financial decisions based on this software.
- ⚠️ **Audit Required**: Before mainnet launch, the codebase will undergo a comprehensive security audit by an external firm.
- ⚠️ **Testnet Stability**: The 90-day testnet stability checkpoint must be passed before mainnet launch.

**By using this software, you acknowledge that:**
1. You are interacting with testnet/devnet, not mainnet
2. The protocol may contain bugs or vulnerabilities
3. Past performance (on testnet) does not guarantee future results
4. Token economics and protocol parameters may change
5. You are responsible for your own due diligence

---

## What Is RAXION

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

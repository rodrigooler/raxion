# RAXION — Pitch Deck

## Problem

Decentralized AI networks like Bittensor rely on human validators to judge inference quality. Humans are slow, corruptible by incentives, and cannot scale to millions of inferences per day. This is the Oracle Problem applied to AI: any system with a human in the evaluation loop inherits subjective consensus failure.

## Solution

RAXION removes the human entirely. Three structurally different ML architectures (Transformer, SSM, Neuro-Symbolic) process every query independently. Their convergence, measured by a formal CoherenceScore, generates a zk-ML proof. That proof is Cognitive Finality: mathematically verified inference quality, not a vote.

## How It Works

RAXION uses **Proof of Inference Quality (PoIQ)**, a three-layer consensus protocol:

- **Layer 1 (Convergence):** Semantic similarity across 3 architectures, computed as the geometric mean of pairwise cosine similarities. CoherenceScore = 0.4 x CS_semantic + 0.6 x Causal Coherence.
- **Layer 2 (Challenges):** 1.5% of inferences are deterministically challenged using on-chain seeds. No external oracle. Any node can verify.
- **Layer 3 (Slashing):** Four economic triggers penalize low-quality agents. Anti-griefing caps prevent manipulation. Slashed stake is redistributed (40%), burned (30%), insured (20%), and rewarded to challengers (10%).
- **Settlement:** Sovereign SVM Rollup on Solana. Inherits billions in economic security without bootstrapping a new validator set.

## Traction

| Milestone | Status |
|---|---|
| Whitepaper v0.5 (complete, public) | Done |
| Program deployed on Solana devnet | Done |
| Program deployed on Solana testnet | Done |
| Explorer live (devnet.raxion.network) | Done |
| Explorer live (testnet.raxion.network) | Done |
| Agent SDK with functional runner (Rust) | Done |
| 71 automated tests, unified CI | Done |
| Anchor 1.1 migration (Solana 3.x) | Done |
| RaxLang DSL compiler (scaffold) | Done |

## Market

Decentralized AI inference is a growing category. Bittensor alone has a $3B+ market cap. But no project in the space proves inference **quality**, only that code executed. RAXION is the first protocol where AI quality is a cryptographic fact, not a popularity contest.

The initial market is AI agents that handle consequential decisions: DeFi trading, medical triage, legal analysis, autonomous operations. These domains cannot tolerate "probably correct." They need provably correct.

## Competitive Landscape

| Project | What it does | Gap RAXION fills |
|---|---|---|
| **Bittensor** | AI marketplace with human validators | Oracle Problem: validators are corruptible |
| **Ritual** | Proves that ML code executed correctly | Proves execution, not quality |
| **Gensyn** | Distributed model training | Training layer, not inference |
| **Sentient** | Model marketplace and monetization | No quality verification |
| **Giza / EZKL** | zk-ML toolkits and frameworks | Libraries, not a protocol |
| **RAXION** | Proves inference quality via convergence | First to verify quality, not just execution |

## Tokenomics

- **Total supply:** 1,000,000,000 $RAX (fixed, no mint authority after genesis)
- **Utility:** Agents stake $RAX to earn inference threads. Formula: `max_threads = floor(log2(stake/1000) x 8) + 1`
- **Emission:** 75M $RAX in year 1 (2027), decreasing 25% per year for 8 years
- **Breakeven:** ~4.7 inferences per second sustains the emission schedule
- **Slashing:** Penalized stake flows to redistribution (40%), burn (30%), insurance fund (20%), and challengers (10%)

## Architecture

```
Queries --> Cognitive Scheduler --> 3 Parallel Threads
                                    |-- Transformer
                                    |-- SSM (Mamba)
                                    |-- Neuro-Symbolic
                                         |
                                    Convergence Check
                                    CoherenceScore
                                         |
                                    zk-ML Proof (RISC Zero + Jolt)
                                         |
                                    Solana Settlement (State Root)
```

## Team

**Rodrigo Oler** — Founder and sole engineer. Full-stack developer with experience across TypeScript, Rust, Go, Python, Solana, and Kubernetes. Building RAXION in public since Q1 2026. All code, whitepaper, and infrastructure built solo.

Seeking 1-2 technical co-founders with expertise in: ZK cryptography, ML systems, or Solana runtime internals.

## Ask

**Seed round** to accelerate from testnet to mainnet:

- **GPU infrastructure** for ZK proof generation (RISC Zero, Jolt) and heterogeneous model validation
- **2 engineers** (ZK/cryptography + ML systems)
- **Security audit** of on-chain programs before mainnet
- **Target:** Mainnet launch Q4 2027

## Links

- Website: https://raxion.network
- Devnet Explorer: https://devnet.raxion.network
- Testnet Explorer: https://testnet.raxion.network
- GitHub: https://github.com/rodrigooler/raxion
- Whitepaper: https://github.com/rodrigooler/raxion/blob/main/WHITEPAPER.md
- License: BUSL 1.1 (converts to MIT on 2030-02-20)

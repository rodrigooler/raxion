# RAXION — TL;DR for the Impatient

> Full whitepaper: [WHITEPAPER.md](./WHITEPAPER.md)

---

## The Problem in One Paragraph

Every decentralized AI project today — Bittensor, Allora, opML — has humans with economic stake deciding whether AI outputs are good. This is not a bug that better token mechanics will fix. It is an axiom problem: when the evaluator has financial skin in the game, judgment systematically drifts toward what the group will reward, not toward what is true. Arrow's Impossibility Theorem (1951) formalizes why no voting mechanism can escape this. RAXION removes the human from the evaluation loop entirely.

---

## Why Existing Solutions Do Not Solve It

| Project | Approach | Why It Fails |
|---|---|---|
| Bittensor | Stake-weighted human validators | Validators herd, collude, and proxy GPT-4 |
| Allora Network | Reputation-weighted consensus | Still requires external resolution for open-domain tasks |
| Ora Protocol (opML) | Optimistic ML — 7-day challenge | Proves execution, not quality. Wrong outputs circulate for 7 days |
| Ritual Infernet | On-chain AI coprocessor | No quality verification — model operator is trusted by assumption |
| Gensyn | Decentralized training compute | Orthogonal problem — doesn't address inference quality |

---

## What RAXION Does Differently

**One sentence:** Three structurally different AI architectures process every query in parallel, and cryptographic convergence among them is the proof of quality — no human required.

**Three concepts:**

**1. Three Architectures, One Query**
Every inference is processed simultaneously by a Transformer (attention-based), an SSM/Mamba (state-space model), and a Neuro-Symbolic system (logic + neural extraction). These three architectures have structurally different failure modes — verified empirically in controlled experiments with identical training data (Waleffe et al., NVIDIA Research 2024). When they agree, it is meaningful. When one diverges, it is detected.

**2. CoherenceScore = Quality Signal**
Agreement among the three architectures is measured as a single number:
```
CoherenceScore = 0.4 × CS_semantic + 0.6 × CC

CS_semantic = geometric_mean(sim(T,S), sim(T,N), sim(S,N))
CC = 0.3×premise_consistency + 0.5×conclusion_agreement + 0.2×entailment_rate
```
- Score < 0.3 → Output rejected, agents slashed
- Score 0.3–0.6 → Accepted with LOW_CONFIDENCE flag
- Score 0.6–0.85 → Standard inference, base reward
- Score > 0.85 → HIGH_CONFIDENCE, premium reward (+30%)

**3. Proof of Inference Quality (PoIQ) — Three Layers**
- **Layer 1:** Statistical convergence → CoherenceScore (every inference)
- **Layer 2:** Stochastic verification → 1.5% of inferences challenged against verifiable ground-truth (math, logic, code). Challenge seed is deterministic from Solana slot hash — no one can predict or avoid their challenge
- **Layer 3:** Graduated slashing → chronic divergers lose stake; high-reliability agents earn premium rewards

The result is a zk-ML proof published on-chain: not just that computation ran, but that quality was reached. This is **Cognitive Finality** — immutable, immediate, verifiable by anyone.

---

## The Token ($RAX)

**What it does:**
- **Stake** → more stake = more parallel inference threads = more throughput capacity
- **Gas** → burned on every inference, proportional to compute used
- **Quality discount** → high-CoherenceScore inferences get up to 30% gas rebate

**Supply mechanics:**
- Fixed total: 1,000,000,000 RAX (no mint function)
- Emission starts 2027, decreases 25%/year for 8 years
- Deflationary crossover expected ~2028 (burn rate exceeds emission rate)
- Break-even burn rate: ~4.7 inferences/second — achievable before mass adoption

**Distribution:**
- 30% PoIQ rewards (8-year schedule)
- 25% Community & Ecosystem
- 15% Team & Advisors (1-year cliff, 3-year linear)
- 15% Ecosystem Fund (DAO-governed post-Mainnet)
- 10% Seed & Strategic (6-month cliff, 18-month linear)
- 5% Protocol Reserve (5-of-9 multisig, emergencies only)

---

## Why This Is Possible Now (And Wasn't Before)

Three technologies converged in 2024–2025:

1. **Jolt and RISC Zero** reduced ZK proof generation for ML inference from hours to seconds
2. **ZK-specific hardware** (Ingonyama and others) is projecting 10–100× acceleration over GPUs
3. **Solana SVM** provides native parallel execution — thousands of Cognition Threads simultaneously

The latency roadmap:
- Devnet 2026: 15–40s (acceptable for testing)
- Testnet 2026: 3–8s (GPU-accelerated provers)
- Mainnet 2027: <5s (ZK ASICs — hardware-dependent)
- Mainnet v2 2028+: <200ms

---

## Roadmap

```
Q1 2026  Phase 0: Genesis — Whitepaper, local PoC, technical spec         ✅ Done
Q2 2026  Phase 1: Devnet — Neural SVM v0.1, PoIQ v0.1, 10 agents
Q3 2026  Phase 1: Mature Devnet — 100 agents, 1,000 queries/day, first slashing
Q4 2026  Phase 2: Testnet — GPU acceleration, PoIQ v0.2, real $RAX, TGE
Q1 2027  Security audit (2 independent firms) + formal PoIQ audit
Q2 2027  Phase 3: Mainnet v1 — ZK ASICs, <5s Cognitive Finality
2028+    Phase 4: Mainnet v2 — <200ms, cross-chain proofs, full DAO
```

---

## What Is Still Unproven (Honest Risks)

RAXION's architecture rests on the **Diversity Hypothesis**: that Transformer, SSM, and Neuro-Symbolic failure sets are non-overlapping enough that convergence is a reliable quality signal. This hypothesis is empirically supported by existing research but has not yet been tested in the RAXION production environment. Devnet is the test.

Three other external dependencies:
- ZK ASIC hardware availability by 2027 (Mainnet latency target depends on this)
- Sufficient Compute Operator adoption to sustain three-architecture availability
- Developer community large enough to sustain the Smart Agent ecosystem

These are declared risks, not footnotes. If Devnet data contradicts the Diversity Hypothesis, this whitepaper will say so.

---

## One-Line Summary for Every Skeptic's Question

**"Isn't this just Bittensor?"**
No. Bittensor has humans deciding quality. RAXION has math deciding quality.

**"Can't colluding validators game it?"**
A three-agent cartel must fool Immutable Core challenges (formal math, logic, code execution). A cartel that consistently answers those correctly is producing correct outputs — which is the goal.

**"Why would AI operators participate?"**
Stake earns capacity. Capacity earns inference revenue. High-reliability agents earn 30% premium rewards. The incentive structure makes honest operation strictly dominant in expected value.

**"What if ZK proofs are too slow?"**
Devnet and Testnet use software provers with 3–40s latency. These phases do not require ASICs. The sub-5s target applies to Mainnet v1 (2027). If hardware is late, launch is delayed — not cancelled.

**"What if all three architectures fail on the same queries?"**
Layer 2 stochastic verification (1.5% challenge rate) catches systematic failure. An agent that cannot answer MATH_FORMAL or LOGIC_SAT challenges correctly will have its RS degrade until slashing terminates it. The Immutable Core is specifically designed to be resistant to correlated failure.

---

## Entry Points

- **Full whitepaper**: [WHITEPAPER.md](./WHITEPAPER.md)
- **Repository**: github.com/raxion-network/raxion
- **Yellowpaper** (formal proofs): Published at Devnet launch, Q2 2026
- **Developer SDK**: Rust SDK available at Devnet launch

*RAXION Whitepaper v0.5 — May 2026*

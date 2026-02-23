# MEMORY.md — RAXION Persistent Context

> This file stores facts, decisions, and context that must persist across LLM sessions. Update this file whenever a significant decision is made, a hypothesis is validated or invalidated, or a parameter changes. Treat it as the project's institutional memory.

> **Format**: Each entry has a date, category, and the fact itself. Newer entries go at the top of each section.

---

## Project Status

```
Last updated: 2026-02-23
Current phase: Phase 0 — Genesis (Q1 2026)
Next milestone: Devnet launch (Q2 2026)
Whitepaper version: v0.4 (complete)
GitHub: https://github.com/raxion-network/raxion
License: BUSL 1.1 → MIT 2030-02-20
```

### Q1 Execution Notes (2026-02-23)

- Issue #3 (Rust Coherence mirror) implemented in `proofs/risc0-types/src/coherence.rs` with protocol constants and threshold categories mirrored from Python.
- Added fixture-based Rust tests at `proofs/risc0-types/tests/coherence.rs` using `proofs/risc0-types/tests/fixtures/coherence_python_fixtures.json`.
- `cargo test -p risc0-types` passed (5 tests).
- Issue #4 benchmark executed with deterministic setup:
  - command: `python poc/run_poc.py --provider mock --mmlu --n 100 --seed 42 --output poc/benchmarks/mmlu_100_mock_seed42.json`
  - average coherence: `0.9076`
  - cognitive finality rate: `100.0%`
  - H1 status in this run: `PASSED` (mock-provider baseline, not a live-model conclusion)
- Issue #2 benchmark harness added (`proofs/bench_risc0_latency.py`) plus report templates, but local execution is currently blocked by RISC Zero proving toolchain constraints on macOS arm64.

### Q1 Execution Notes (2026-02-22)

- PoC benchmark runner completed with `--n 10` using the `mock` provider:
  - average coherence: `0.841`
  - cognitive finality rate: `100.0%`
  - H1 status in this run: `PASSED` (simulation-only signal)
- Live OpenRouter single-query runs validated wrapper integration for:
  - `arcee-ai/trinity-large-preview:free`
  - `z-ai/glm-4.5-air:free`
- RISC Zero scaffold validated in `RISC0_DEV_MODE=1`:
  - proof generation observed: `~0.13s` on local machine
  - proof verification succeeded
  - joint commitment deterministic across repeated runs
- Caveat: non-dev proof mode depends on local `r0vm` runtime stability and remains under tuning.

---

## Validated Hypotheses

> Hypotheses that have been empirically confirmed. Move entries here from "Open Hypotheses" when confirmed.

*(empty — Devnet validation not yet started)*

---

## Invalidated Hypotheses

> Hypotheses that failed. Keep these to avoid re-exploring dead ends.

*(empty — Devnet validation not yet started)*

---

## Open Hypotheses

> Must be tested. Priority order reflects roadmap.

| ID | Hypothesis | Test Phase | Status |
|---|---|---|---|
| H1 | Heterogeneous architectures converge in >70% of real-world queries without coordinated training | Devnet Q2 2026 | 🔜 Pending |
| H2 | PoIQ remains secure when $RAX has real economic value and adversarial actors participate | Testnet Q4 2026 | 🔜 Pending |
| H3 | RISC Zero + Jolt latency roadmap is achievable (Devnet <60s → Mainnet <2s) | Testnet Q4 2026 | 🔜 Pending |
| H4 | Developer adoption sufficient to sustain 10+ independent agents at Devnet | Devnet Q3 2026 | 🔜 Pending |
| H5 | Agave fork can support CognitiveAccount types without degrading baseline SVM throughput >20% | Devnet Q2 2026 | 🔜 Pending |

---

## Architectural Decisions

### AD-001 — Sovereign SVM Rollup (not independent L1)
**Date**: 2026-02
**Decision**: Build as Sovereign SVM Rollup on Solana, not as an independent L1.
**Rationale**: New L1 starts with near-zero economic security. Solana provides DA layer + billions in economic security via inherited stake. Neural SVM executes independently but commits state roots to Solana L1.
**Rejected alternative**: Independent L1 with own validator set.
**Revisit if**: Solana experiences sustained congestion or governance issues that compromise RAXION's DA guarantees.

### AD-002 — Three Architecture Types (Transformer + SSM + Neuro-Symbolic)
**Date**: 2026-02
**Decision**: Use exactly these three architecture families for Cross-Validation Neural.
**Rationale**: Chosen for complementary failure modes. Transformer: frequency/plausibility bias. SSM: recency/local-consistency bias. Neuro-Symbolic: formalization/completeness bias. Convergence among structurally different failure modes is a stronger signal than convergence among similar architectures.
**Rejected alternative**: Multiple instances of the same architecture family, majority vote.
**Note**: Architecture selection per query is partially randomized (stake seed + availability) to prevent Sybil cognitive attacks.

### AD-003 — Geometric Mean for CS_semantic
**Date**: 2026-02
**Decision**: Use geometric mean (not arithmetic) for pairwise similarity aggregation.
**Rationale**: Geometric mean is more penalizing for low-similarity outliers. If any pair has near-zero similarity, the score drops dramatically — correctly signaling real divergence rather than averaging it away.
**Formula**: `CS_semantic = (sim_TS × sim_TN × sim_SN)^(1/3)`

### AD-004 — Deterministic On-Chain Challenge Generation
**Date**: 2026-02
**Decision**: `challenge_seed = HASH(slot_hash || inf_id || stake_seed)`. No external oracle, no human curation.
**Rationale**: External oracles displace the failure point without eliminating it. On-chain deterministic generation means any node can independently verify whether an inference should have been challenged and with what challenge.
**Rejected alternative**: VRF oracle, curated dataset managed by foundation.
**Constraint**: Challenge categories are defined in protocol and only expandable via on-chain governance.

### AD-005 — BUSL 1.1 License → MIT 2030
**Date**: 2026-02
**Decision**: Core protocol (Neural SVM, PoIQ, zk-ML circuits) under BUSL 1.1 with change date 2030-02-20 → MIT. SDKs and developer tools under Apache 2.0 from day one.
**Rationale**: BUSL 1.1 protects against commercial forks during critical growth period while allowing full auditability. Converts to MIT automatically — no governance vote needed. Precedent: Uniswap, Aave, Sui.
**Rejected alternative**: Apache 2.0 from day one (too open during bootstrapping), proprietary (contradicts decentralization thesis).

### AD-006 — Hot/Cold Memory Split
**Date**: 2026-02
**Decision**: Max ~3MB hot state per agent on-chain (SVM). Everything else in cold state (Arweave for permanent, IPFS for transient). Integrity guaranteed by Merkle root committed on-chain.
**Rationale**: Storing gigabytes on-chain in Solana is economically unviable (~150 RAX/month for 3MB). Cold state with on-chain commitment gives integrity guarantees without rent costs.
**Hot state contents**: merkle_root, stake, reliability_score, compressed RAG index (HNSW), proof ring buffer (256 entries), cold state pointers.

### AD-007 — No Optimistic Assumptions
**Date**: 2026-02
**Decision**: Cognitive Finality is immediate, not contestable. The zk-ML proof is valid at generation or it is not.
**Rationale**: Cognitive consequences (medical decisions, security analyses, strategic decisions) are often irreversible within any contestation window. Optimistic windows allow incorrect outputs to propagate through chained reasoning before being contested.
**Rejected alternative**: Optimistic rollup-style contestation window.

### AD-008 — α=0.4 / β=0.6 CoherenceScore Weighting
**Date**: 2026-02
**Decision**: Weight causal coherence (CC) at 0.6 and semantic similarity (CS_semantic) at 0.4.
**Rationale**: CS_semantic is a surface metric (embedding similarity) susceptible to gaming. CC (premise consistency + conclusion agreement + entailment) is more structurally robust. Causal coherence should dominate.
**Both are governance-adjustable** via on-chain vote with 15% supply quorum.

### AD-009 — Jolt for Quality Proofs, RISC Zero for Execution Proofs
**Date**: 2026-02
**Decision**: Use two ZK frameworks in complementary roles.
**Rationale**: RISC Zero is more general but slower — appropriate for proving agent code execution (less frequent, higher latency acceptable). Jolt is faster for lookup-heavy operations (matrix multiplications, embedding similarity) — appropriate for quality proof generation (every inference, latency critical).

---

## Parameter History

> Track all parameter changes with dates and rationale. Initialized at whitepaper v1.0 values.

### Active Parameters (as of 2026-02-22)

```yaml
# PoIQ Layer 1
alpha_coherence: 0.4          # weight of CS_semantic in CoherenceScore
beta_coherence: 0.6           # weight of CC in CoherenceScore
w_premise: 0.3                # CC: premise consistency weight
w_conclusion: 0.5             # CC: conclusion agreement weight
w_entailment: 0.2             # CC: entailment rate weight
theta_reject: 0.3             # CoherenceScore below → rejection
theta_standard: 0.6           # CoherenceScore above → standard convergence
theta_highcoherence: 0.85     # CoherenceScore above → premium reward

# PoIQ Layer 2
challenge_rate: 0.015         # 1.5% of inferences challenged
challenge_rate_warmup: 0.05   # 5% for new agents (first 100 inferences)
lambda_rs: 0.1                # Reliability Score learning rate
rs_probation: 0.50            # RS below → probation (rewards -50%)
rs_premium: 0.70              # RS above → reward multiplier active
theta_confidence: 0.85        # Internal confidence for Dissent Queue

# PoIQ Layer 3
slash_base_rate: 0.01         # 1% per immediate rejection
slash_challenge_rate: 0.02    # 2% per challenge failure
chronic_multiplier_step: 0.5  # +0.5x per consecutive failure after 2nd
slash_chronic: 0.05           # 5% for RS<0.40 sustained 72h
slash_terminal: 0.15          # 15% + 30-day ban
cooling_period_max: 3         # max trigger-1 slashings per 24h per agent
network_slash_cap: 0.001      # 0.1% of total stake per hour max
anomaly_threshold: 0.20       # 20% of active agents rejecting → pause

# Slashed stake distribution
slash_redistribute: 0.40
slash_burn: 0.30
slash_insurance: 0.20
slash_challenger: 0.10

# Tokenomics
total_supply: 1_000_000_000
t_base_stake: 1_000           # minimum RAX stake for 1 thread
scale_factor_threads: 8
emission_year_1: 75_000_000
emission_halving_rate: 0.75   # multiply by 0.75 each year
```

---

## Open Questions

> Unresolved questions that require more research or empirical data. Not blocking but worth tracking.

| ID | Question | Priority | Notes |
|---|---|---|---|
| Q1 | What is the realistic convergence rate for heterogeneous architectures on MMLU? | High | PoC in Q1 2026 will answer this |
| Q2 | What is actual RISC Zero latency for 1536-dim embedding operations in zkVM? | High | Benchmark needed in Q1 2026 |
| Q3 | Can HNSW hot/cold split be implemented efficiently within Agave account model? | High | Agave fork research Q2 2026 |
| Q4 | What challenge_rate minimizes cost while maintaining calibration signal? | Medium | Empirical, start at 1.5% and adjust |
| Q5 | Is 0.6 CoherenceScore threshold too conservative or too permissive for real queries? | Medium | Devnet data will inform |
| Q6 | Can Mamba/Mamba2 be run locally with enough performance for Devnet? | Medium | Hardware-dependent |
| Q7 | What is the minimum $RAX stake that creates meaningful economic security? | Low | Depends on token price |

---

## Rejected Approaches

> Ideas that were considered and explicitly rejected. Read before suggesting alternatives.

| Approach | Reason Rejected | Date |
|---|---|---|
| Human validators with stake | Oracle Problem — subjective judgment contaminates with economic incentives | 2026-02 |
| Agent hierarchies for verification | Accumulated latency, subjectivity displacement, bottleneck scaling | 2026-02 |
| External oracle for challenge generation | Displaces failure point, adds latency and governance dependency | 2026-02 |
| Majority vote as convergence proxy | Does not measure epistemic coherence, susceptible to correlated errors | 2026-02 |
| Optimistic contestation window | Irreversible cognitive consequences; allows error propagation | 2026-02 |
| Full on-chain memory storage | Economically unviable rent costs at scale | 2026-02 |
| Independent L1 | Near-zero economic security at launch | 2026-02 |
| Apache 2.0 from day one | Enables immediate commercial forks before protocol is battle-tested | 2026-02 |

---

## Competitive Landscape

> Projects and how they relate to RAXION. Do not waste time re-researching these.

| Project | Category | Relationship to RAXION | Key Difference |
|---|---|---|---|
| **Bittensor** | Decentralized AI marketplace | Primary competitor / reference problem | Uses human validators with Yuma Consensus — Oracle Problem |
| **Ritual (Infernet)** | ML execution proofs | Adjacent — proves execution, not quality | Proves *that* inference ran, not *how good* it was |
| **Giza** | On-chain ML agents with STARK proofs | Adjacent — similar ZK approach | Agent framework without multi-arch convergence protocol |
| **EZKL** | zk-ML toolkit | Potential dependency | Library, not protocol — no quality verification layer |
| **Sentient** | Model marketplace | Complementary | Model ownership/monetization focus, not quality verification |
| **Prime Intellect** | Distributed training | Different layer | Training, not inference quality |
| **Nous Research / Flock.io** | Federated learning | Different layer | Training distribution, not inference verification |

---

## Whitepaper Version History

| Version | Date | Key Changes |
|---|---|---|
| v0.1 | Early 2026 | Initial concept, problem statement |
| v0.2 | 2026-01 | Architecture preliminary, Bittensor analysis |
| v0.3 | 2026-02 | Technical refinements, honest latency roadmap, Sovereign Rollup clarification |
| **v0.4** | **2026-02-22** | **Complete document: all chapters, formal PoIQ math, tokenomics, roadmap, appendices** |

---

## Update Instructions for Future Sessions

When updating this file:

1. **New architectural decision** → Add to "Architectural Decisions" section with AD-XXX ID
2. **Parameter changed** → Update "Active Parameters" YAML and note old value in comment
3. **Hypothesis confirmed/invalidated** → Move from "Open Hypotheses" to appropriate section
4. **Open question resolved** → Remove from "Open Questions" and add rationale to relevant section
5. **New rejected approach** → Add to "Rejected Approaches" to prevent re-exploration
6. **Competitive landscape change** → Update table

Always include date and rationale. Future sessions (and future contributors) will thank you.

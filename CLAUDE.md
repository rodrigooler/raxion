# CLAUDE.md — Claude Context for RAXION

> This file is optimized for Claude (claude.ai, Claude Code, API). It provides high-density context, decision rationale, and prompt patterns to minimize back-and-forth in sessions. Read `AGENTS.md` first for technical structure, then use this file for deeper reasoning context.

---

## Project Identity

**RAXION** is a Sovereign SVM Rollup settled on Solana that proves AI inference quality mathematically — replacing human subjective consensus with cryptographic proofs.

**Core thesis**: Bittensor's failure is not an implementation problem. It is an axiom problem. Any system with a human in the inference evaluation loop inherits the Oracle Problem. RAXION removes the human entirely.

**The mechanism**: Three heterogeneous ML architectures (Transformer, SSM, Neuro-Symbolic) process queries in parallel. Convergence among them — measured by a formal Coherence Score — generates a zk-ML proof. That proof is Cognitive Finality.

---

## Current Phase

**Phase 1 — Devnet (Q2 2026)**

Active work:
- PoIQ v0.1 on-chain path and deterministic challenge flow
- Runtime cognitive extensions and SDK stabilization
- RISC Zero embedding commitment path validation
- Devnet explorer hardening and deployment flow

**Do not** ask Claude to implement Testnet/Mainnet-only scope (GPU proving, full 6 challenge categories, TGE tokenomics) yet.

---

## Decision Log (Why We Made Key Choices)

Read this before asking "why didn't you just...":

| Decision | Rationale | Alternative Rejected |
|---|---|---|
| Sovereign SVM Rollup (not L1) | New L1 starts with near-zero economic security; Solana inherits billions in stake | Independent L1 with own validator set |
| Three heterogeneous architectures | Complementary failure modes — correlated errors are detectable | Single architecture with multiple instances |
| Geometric mean for CS_semantic | More penalizing for low-similarity outliers than arithmetic mean | Simple average, majority vote |
| Deterministic on-chain challenge seed | Eliminates external oracle dependency; any node can verify | Curated challenge dataset, VRF oracle |
| BUSL 1.1 license → MIT 2030 | Protects core protocol during critical growth without preventing audits | Apache 2.0 (too open), proprietary (too closed) |
| Hot/cold memory split | On-chain rent for >3MB per agent is economically unviable | Full on-chain storage, pure off-chain |
| No optimistic assumptions | Cognitive consequences are irreversible; 7-day challenge windows allow harmful propagation | Optimistic rollup-style contestation |
| Jolt for quality proofs | 10–100x faster than RISC Zero for matrix operations / embedding similarity | RISC Zero for everything |
| α=0.4, β=0.6 weighting | Causal coherence is more robust than surface embedding similarity | Equal weighting |
| Agent stake PDA derivation is fixed | Prevents arbitrary stake injection in slashing paths; Anchor enforces seeds/owner constraints | Free-form external stake account input |
| Stake source-of-truth is protocol stake PDA | Financial math must use synchronized protocol-owned state; scheduler cache is non-canonical | CognitiveAccount cache or SPL token account as slash source |
| `chronic_multiplier_milli` derived on-chain | Removes client-controlled slashing amplification vector; bounded deterministic behavior | Client-provided chronic multiplier |
| `is_final` depends on challenge lifecycle | Enforces that challenged inferences are not final until verified pass | Marking final immediately when score ≥0.60 |
| Q2 completion requires anti-manipulation invariants | Events alone are insufficient; deterministic challenge + stake constraints + on-chain derivation are mandatory | Declaring completion by happy-path event output |

---

## Protocol Parameters Reference

When Claude needs exact numbers — use these, do not invent:

```
# PoIQ Layer 1
CoherenceScore = 0.4 × CS_semantic + 0.6 × CC
CS_semantic = geometric_mean(sim_TS, sim_TN, sim_SN)
CC = 0.3×consistency(P) + 0.5×agreement(C) + 0.2×entailment
Rejection threshold: 0.3
Standard convergence: 0.6–0.85
High coherence: >0.85

# PoIQ Layer 2
challenge_rate = 1.5% (1 in ~67 inferences)
challenge_seed = HASH(slot_hash || inf_id || stake_seed)
RS_new = 0.9×RS_old + 0.1×result  (λ=0.1)
RS probation threshold: <0.50
RS premium threshold: >0.70

# PoIQ Layer 3
slash_immediate = stake × 0.01 × (1 - CoherenceScore/0.3)
slash_challenge = stake × 0.02 × chronic_multiplier
slash_chronic = stake × 0.05  (RS < 0.40 for 72h)
slash_terminal = stake × 0.15
Slashed stake: 40% redistribute → 30% burn → 20% insurance → 10% challenger
Network cap: 0.1% of total stake per hour
Anomaly pause: triggered if >20% of active agents reject simultaneously

# Tokenomics
Total supply: 1,000,000,000 RAX (fixed, no mint)
max_threads = floor(log₂(stake/1000) × 8) + 1
Emission year 1 (2027): 75M RAX
Emission halvened -25%/year for 8 years
Breakeven ~4.7 inferences/second

# Memory
Hot state max: ~3MB per agent (~150 RAX/month rent)
Proof ring buffer: 256 entries
Embedding dim: 1536 (default)
```

---

## Prompt Patterns for Common Tasks

### Starting a new session with full context

Paste this at the start of a Claude session when working on RAXION:

```
I'm working on RAXION — a Sovereign SVM Rollup on Solana that replaces human 
consensus in decentralized AI with Proof of Inference Quality (PoIQ).

Context files: AGENTS.md (repo structure + invariants), CLAUDE.md (this), MEMORY.md (decisions).

Current phase: Phase 1 (Q2 2026) — Devnet implementation and validation.
Next milestone: Testnet preparation (Q3/Q4 2026).

Key files:
- Whitepaper: docs/whitepaper/RAXION_Whitepaper_v0.4_EN.md
- Core formulas: Chapter 3 of whitepaper
- Architecture: AGENTS.md

Task: [your task here]
```

### Asking Claude to implement PoIQ formulas

```
Implement the CoherenceScore calculation for RAXION's PoIQ Layer 1.

Exact formulas from the protocol:
- CS_semantic = geometric_mean(cosine(T,S), cosine(T,N), cosine(S,N))
- CC = 0.3×consistency(premises) + 0.5×agreement(conclusions) + 0.2×entailment_rate
- CoherenceScore = 0.4×CS_semantic + 0.6×CC

Thresholds: reject <0.3, low_conf 0.3–0.6, standard 0.6–0.85, premium >0.85

Language: [Rust / Python]
The implementation must exactly match the whitepaper Chapter 3 definitions.
```

### Asking Claude to review architectural decisions

```
I'm making a decision about [X] in RAXION.

Project constraints (non-negotiable):
1. No human in the inference evaluation loop
2. All challenges generated deterministically from on-chain state
3. Cognitive Finality = immediate, not optimistic
4. Hot state ≤ 3MB per agent
5. Total $RAX supply fixed at 1B

My proposed approach: [description]

Questions:
1. Does this violate any of the 5 constraints?
2. Does it conflict with any decision in the Decision Log?
3. What are the failure modes?
```

### Asking Claude to write Smart Agent code

```
Write a RAXION Smart Agent in Rust using the Agent SDK.

Agent purpose: [description]
Domain: [domain]
Memory needs: [what the agent should remember between queries]

SDK conventions (from AGENTS.md):
- Implement the SmartAgent trait from sdk/agent/src/agent.rs
- Use memory.recall(query, top_k=N) for context retrieval
- Use inference::submit() to send to the Cognitive Scheduler
- Never write directly to account data — use memory.rs abstractions
- Tag all slashing-related logic with // SLASHING: comment

The agent should handle query → inference → memory update cycle.
```

### Asking Claude to write tests

```
Write tests for [component] in RAXION.

Required test coverage per AGENTS.md:
- Every PoIQ formula: unit test with known inputs/outputs
- Slashing: cover all 3 triggers + 3 anti-griefing caps
- Challenge determinism: same (slot_hash, inf_id, stake_seed) → same challenge

Use this test fixture for CoherenceScore validation:
  identical outputs → CS_semantic ≈ 1.0
  orthogonal outputs → CS_semantic ≈ 0.0
  partially similar → CS_semantic ∈ (0.3, 0.7)
```

---

## What Claude Should NOT Do in This Project

- **Do not invent protocol parameters** — all numbers are in this file or the whitepaper
- **Do not suggest optimistic verification** — Cognitive Finality is immediate by design decision
- **Do not suggest adding human curation** to challenge generation — explicitly rejected
- **Do not implement RaxLang** features yet — Testnet phase only
- **Do not expand hot state** beyond 3MB — send to cold state instead
- **Do not suggest majority vote** as a proxy for CoherenceScore — it is categorically different

---

## Glossary Quick Reference

| Term | Definition |
|---|---|
| **Cognitive Finality** | State where a zk-ML proof is valid and committed to Solana settlement layer — immutable |
| **CoherenceScore** | 0.4×CS_semantic + 0.6×CC — epistemic coherence among 3 architectures |
| **Cognition Thread** | Atomic unit of parallel inference — one architecture, one query, one partial proof |
| **Cognitive Scheduler** | Decomposes queries into DAGs of parallel threads |
| **NativeMemoryAccount** | On-chain sovereign memory for a Smart Agent (hot state) |
| **Reliability Score (RS)** | Exponential moving average of challenge performance (λ=0.1) |
| **PoIQ** | Proof of Inference Quality — the three-layer consensus protocol |
| **π_exec** | Execution proof — RISC Zero proof that agent code produced output |
| **π_quality** | Quality proof — Jolt proof of CoherenceScore computation |
| **π_poiq** | Aggregated final proof = AGGREGATE(π_exec×3, π_quality) |
| **Dissent Queue** | Holding area for high-confidence divergent outputs awaiting challenge |
| **Sovereign SVM Rollup** | Neural SVM executes independently; commits state roots to Solana settlement layer |

---

## Files Claude Should Reference by Task

| Task | Primary file | Secondary file |
|---|---|---|
| Protocol math | Whitepaper Chapter 3 | This file (Parameters section) |
| Architecture decisions | AGENTS.md | Decision Log above |
| Persistent decisions | MEMORY.md | Decision Log above |
| Rust coding conventions | AGENTS.md (Coding Standards) | runtime/cognitive/ |
| PoC Python work | poc/ directory | AGENTS.md (Phase table) |
| Tokenomics | Whitepaper Chapter 4 | Parameters section above |
| Roadmap / scope | Whitepaper Chapter 5 | Phase table in AGENTS.md |

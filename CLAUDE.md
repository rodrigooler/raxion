# CLAUDE.md — Claude Context for RAXION

> This file is optimized for Claude (claude.ai, Claude Code, API). It provides high-density context, decision rationale, and prompt patterns to minimize back-and-forth in sessions. Read `AGENTS.md` first for technical structure, then use this file for deeper reasoning context.

---

## Project Identity

**RAXION** is a Sovereign SVM Rollup settled on Solana that proves AI inference quality mathematically — replacing human subjective consensus with cryptographic proofs.

**Core thesis**: Bittensor's failure is not an implementation problem. It is an axiom problem. Any system with a human in the inference evaluation loop inherits the Oracle Problem. RAXION removes the human entirely.

**The mechanism**: Three heterogeneous ML architectures (Transformer, SSM, Neuro-Symbolic) process queries in parallel. Convergence among them — measured by a formal Coherence Score — generates a zk-ML proof. That proof is Cognitive Finality.

---

## Current Phase

**Phase 2 — Testnet (Q4 2026)**

- Phase 0 (Q1 2026) ✅ — Whitepaper, Python PoC, RISC Zero basic integration
- Phase 1 (Q2 2026) ✅ — Agave integration, PoIQ v0.1, Agent SDK v0.1, Devnet deploy
- Phase 2 (Q4 2026) 🟡 — GPU proofs, all PoIQ layers, RaxLang v0.1

---

## Live Environments (verified 2026-06-29)

| Env | Explorer | RPC | Status |
|---|---|---|---|
| **Devnet** | https://devnet.raxion.network | `api.devnet.solana.com` | 15 InferenceRecords live |
| **Testnet** | https://testnet.raxion.network | `api.testnet.solana.com` | 15 InferenceRecords live |

- **Program ID** (both networks): `5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT`
- **Wallet**: `6LeyWdxSsnrJrqyXNBSd9PuH6c2mkETV6NawDs87vLK4`
- **Cloudflare Worker**: `raxion-explorer` (single worker, hostname-based network detection)
- **Docker image**: `raxion/anchor-devnet:0.1` (cargo-binstall, Apple container compatible)
- **Workers.dev**: https://raxion-explorer.roodrigoprogrammer.workers.dev

---

## Operations Quick Reference

### Deploy program to devnet/testnet
```bash
container run --rm --platform linux/amd64 \
  -v "$(pwd)":/work -v "$HOME/.config/solana":/home/raxion/.config/solana \
  -e HOME=/home/raxion -e CARGO_HOME=/work/.cargo-home -w /work \
  raxion/anchor-devnet:0.1 bash -c "
    solana config set --url <devnet|testnet> --keypair /home/raxion/.config/solana/id.json &&
    cargo build-sbf --manifest-path programs/raxion-poiq/Cargo.toml &&
    cp programs/raxion-poiq/target/deploy/raxion_poiq.so target/deploy/ &&
    solana program deploy target/deploy/raxion_poiq.so --program-id target/deploy/raxion_poiq-keypair.json"
```

### Seed test inferences
```bash
ln -sf apps/explorer/node_modules node_modules
node scripts/devnet_seed.mjs 15                                           # devnet
SOLANA_RPC_URL=https://api.testnet.solana.com node scripts/devnet_seed.mjs 15  # testnet
```

### Deploy explorer to Cloudflare
```bash
cd apps/explorer
CLOUDFLARE_API_TOKEN="<token>" npx vinext deploy --name raxion-explorer
```

### Run tests
```bash
cargo test --workspace                              # Rust workspace (42 tests)
.venv/bin/pytest poc/tests/ -v                      # Python PoC (23 tests)
cd apps/explorer && npm run build                   # Explorer build check
```

---

## Known Limitations (devnet/testnet, 2026-06-29)

- **SlotHashes sysvar** fails to deserialize (solana-program 1.18 vs Solana 2.x). Challenge seed uses Clock-based fallback (predictable). Fix when anchor-lang supports Solana 2.x.
- **Anchor IDL build** fails with Rust 1.88 on native target. Deploy uses `cargo build-sbf` + `solana program deploy` directly.
- **SDK agent runner** is a stub. No external agents can run yet.
- **PoC architectures** are LLM proxies, not real heterogeneous models.
- **Solana public RPC** blocks Cloudflare Workers IPs. Explorer uses client-side fetch (browser → RPC directly).

---

## Commit Convention

- Use Conventional Commits for all commits.
- Default prefixes: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Use scoped messages when helpful, for example `feat(site): ...`.
- Do not use vague commit subjects like `update`, `misc`, or `wip`.

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

### Q2 Review Decisions (AD-010 to AD-014)

- **AD-010** Stake PDA derivation is canonical.
- **AD-011** Slashing source-of-truth is protocol stake PDA.
- **AD-012** Chronic multiplier is derived on-chain (not client-input).
- **AD-013** `is_final` depends on challenge lifecycle, not score-only.
- **AD-014** Q2 completion requires anti-manipulation invariants.

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
| Deploy / infra | This file (Operations section) | ops/docker/, scripts/ |
| Explorer | apps/explorer/ | This file (Live Environments) |

---

## Infrastructure Identifiers

```
# Solana
Program ID:     5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT
Wallet:         6LeyWdxSsnrJrqyXNBSd9PuH6c2mkETV6NawDs87vLK4
Keypair:        ~/.config/solana/id.json

# Cloudflare
Account ID:     0fdeec112211a86b30959041506f9593
Zone ID:        17a26b101fe05b226a0fdd565a19c0c5
Worker:         raxion-explorer
Domains:        devnet.raxion.network, testnet.raxion.network

# Docker
Image:          raxion/anchor-devnet:0.1
Dockerfile:     ops/docker/anchor-devnet/Dockerfile
```

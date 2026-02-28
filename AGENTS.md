# AGENTS.md — RAXION Project Agent Context

> This file provides structured context for AI agents (Cursor, Codex, Claude Code, Copilot, etc.) working on the RAXION codebase. Read this before writing any code, opening any PR, or making architectural decisions.

---

## What Is RAXION

RAXION is a **Sovereign SVM Rollup on Solana** that replaces subjective human consensus in decentralized AI with **Proof of Inference Quality (PoIQ)** — a three-layer cryptographic protocol that verifies reasoning quality without any human in the inference loop.

The core innovation is **Cognitive Finality**: zk-ML proofs that make a collective reasoning result as immutable as a financial transaction.

**One-line mental model**: Bittensor uses humans with tokens to judge AI quality. RAXION uses math.

---

## Repository Structure

```
raxion/
├── apps/
│   ├── explorer/               # Devnet explorer (Next.js)
│   └── site/                   # Static website
│
├── ops/
│   ├── docker/                 # Pinned container images/toolchains
│   └── config/
│       └── deploy/             # Deployment env templates
│
├── runtime/                    # Neural SVM extensions (Agave base fetched on demand)
│   ├── cognitive/
│   │   ├── account_types.rs    # CognitiveAccount, NativeMemoryAccount structs
│   │   ├── scheduler.rs        # CognitiveScheduler — parallel thread dispatch
│   │   ├── memory.rs           # Hot/cold state management
│   │   └── convergence.rs      # CoherenceScore calculation
│   └── zk/
│       ├── risc_zero.rs        # Execution proof integration (π_exec)
│       └── jolt.rs             # Quality proof integration (π_quality)
│
├── programs/                   # Anchor on-chain programs (Solana)
│   ├── raxion-poiq/            # PoIQ protocol — convergence + slashing
│   ├── raxion-memory/          # Native Memory Account CRUD
│   └── raxion-governance/      # On-chain parameter governance
│
├── sdk/
│   ├── agent/                  # Rust SDK for Smart Agent development
│   │   ├── src/agent.rs        # SmartAgent trait
│   │   ├── src/memory.rs       # Memory read/write helpers
│   │   └── src/inference.rs    # Submit inference to scheduler
│   └── raxlang/                # RaxLang DSL compiler (Testnet+)
│
├── proofs/
│   ├── risc0-guest/            # RISC Zero guest programs (run inside zkVM)
│   └── jolt-circuits/          # Jolt circuits for embedding ops
│
├── poc/                        # Q1 2026 proof-of-concept (Python)
│   ├── architectures/          # Model wrappers (Transformer, SSM)
│   ├── convergence/            # CoherenceScore implementation
│   └── run_poc.py
│
├── docs/
│   ├── whitepaper/             # Whitepaper source (EN + PT)
│   ├── yellowpaper/            # Formal proofs (WIP)
│   └── api/                    # SDK reference docs
│
├── AGENTS.md                   # ← you are here
├── CLAUDE.md                   # Claude-specific context
├── MEMORY.md                   # Persistent facts for LLM sessions
└── README.md
```

---

## Core Concepts Every Agent Must Understand

### 1. The Three PoIQ Layers

| Layer | What It Does | Key Formula |
|---|---|---|
| **Layer 1: Statistical Convergence** | Measures epistemic coherence between 3 architectures | `CoherenceScore = 0.4×CS_semantic + 0.6×CC` |
| **Layer 2: Stochastic Verification** | 1.5% of inferences challenged with deterministic on-chain problems | `challenge_seed = HASH(slot_hash \|\| inf_id \|\| stake_seed)` |
| **Layer 3: Slashing** | Penalizes chronic divergence progressively | `slash = stake × rate × chronic_multiplier` |

### 2. The Three Architectures

Every inference is processed by **three independent architecture types** in parallel:

- **Transformer** (attention-based, e.g. Llama-family) — frequency/plausibility biases
- **SSM** (State-Space Model, e.g. Mamba) — recency/local-consistency biases
- **Neuro-Symbolic** — formalization/completeness biases

These are chosen for **complementary failure modes**. Convergence among them is a structural signal, not a vote.

### 3. Native Memory Accounts

Every Smart Agent has a `NativeMemoryAccount` with:
- **Hot state** (on-chain SVM): merkle root, reliability score, compressed RAG index, proof ring buffer
- **Cold state** (Arweave/IPFS): full context, reasoning logs, model weights — referenced by hash

Never store >3MB of hot state per agent. Everything else goes cold.

### 4. Cognitive Finality

A result has Cognitive Finality when:
```
VERIFY(π_exec × 3) = ACCEPT
∧ VERIFY(π_quality) = ACCEPT
∧ CoherenceScore ≥ 0.60
∧ commit(output, π_poiq, slot) ∈ Solana settlement layer
```

This is the only valid definition. Do not treat any intermediate state as final.

### 5. $RAX Token Mechanics

- **Stake** determines max parallel Cognition Threads: `floor(log₂(stake/1000) × 8) + 1`
- **Gas** is burned per inference proportional to proof complexity
- **Slashed stake** goes: 40% → high-coherence agents, 30% → burn, 20% → insurance, 10% → challengers

---

## Development Phases and What Is In Scope

| Phase | Status | In Scope |
|---|---|---|
| **Phase 0 — Genesis** (Q1 2026) | ✅ Completed | Whitepaper, Python PoC, RISC Zero basic integration |
| **Phase 1 — Devnet** (Q2–Q3 2026) | 🟡 Active | Agave integration, PoIQ v0.1, Agent SDK v0.1 |
| **Phase 2 — Testnet** (Q4 2026) | 🔜 Planned | GPU proofs, all PoIQ layers, RaxLang v0.1 |
| **Phase 3 — Mainnet v1** (2027) | 🔜 Planned | ZK ASICs, full protocol, $RAX live |

**Current phase is Phase 1 (Devnet).** Do not implement Testnet/Mainnet-only features in this stage.

---

## Commit Convention

- Use Conventional Commits for every commit message.
- Preferred prefixes: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Add scope when it increases clarity, for example: `feat(site): ...` or `fix(programs): ...`.
- Keep the subject line imperative and specific. Avoid vague messages like `update stuff`, `changes`, or `wip`.

---

## Coding Standards

### Rust (runtime, programs, SDK)

- Use `thiserror` for error types, never `unwrap()` in library code
- All `CognitiveAccount` mutations must go through the `memory.rs` abstraction layer — never write directly to account data
- Proof generation calls are async — always use `tokio::spawn` for parallel thread dispatch
- Tag all slashing-related logic with `// SLASHING:` comment for auditability
- Every public function in `raxion-poiq` program must have a doc comment with the PoIQ formula it implements

```rust
/// Calculates semantic convergence score using geometric mean of pairwise cosine similarities.
/// Formula: CS_semantic = (sim(T,S) × sim(T,N) × sim(S,N))^(1/3)
/// See: whitepaper Chapter 3, Definition 2
pub fn semantic_convergence_score(
    emb_t: &[f32],
    emb_s: &[f32],
    emb_n: &[f32],
) -> f32 { ... }
```

### Python (PoC only)

- PoC code lives in `poc/` — it is throwaway validation code, not production
- Use type hints everywhere
- CoherenceScore must match the Rust implementation exactly — keep a shared test fixture

### Tests

- Every PoIQ formula must have a unit test with known inputs/outputs
- Slashing tests must cover: immediate rejection, challenge failure, chronic divergence, AND the anti-griefing caps
- Challenge determinism must be tested: same `(slot_hash, inf_id, stake_seed)` → same challenge, always

---

## Critical Invariants (Never Break These)

1. **No human in the inference loop** — no voting, no human-reviewed challenges, no admin override of CoherenceScore
2. **Challenge seed is deterministic** — `HASH(slot_hash || inf_id || stake_seed)` is the only valid generation method
3. **Cognitive Finality requires all three π_exec proofs** — partial proofs are not final
4. **Hot state ≤ 3MB per agent** — enforce at the account type level
5. **Slashing cap: 0.1% of total stake per hour network-wide** — must be enforced in the slashing program
6. **$RAX total supply is fixed at 1,000,000,000** — no mint authority after genesis

---

## Common Mistakes to Avoid

❌ **Don't use majority vote** as a convergence proxy — it is not CoherenceScore  
❌ **Don't store embeddings on-chain** — only hashes and compressed indices  
❌ **Don't skip the cold-state pointer** when creating a NativeMemoryAccount  
❌ **Don't generate challenge seeds off-chain** — they must be derived from on-chain state  
❌ **Don't implement Optimistic Rollup semantics** — Cognitive Finality is immediate, not contestable  
❌ **Don't treat Phase 0 PoC as production code** — it lives in `poc/`, not in `runtime/`

---

## Key Files to Read Before Touching Core Logic

| File | Why |
|---|---|
| `runtime/cognitive/convergence.rs` | Implements the 4 formal definitions of CoherenceScore |
| `programs/raxion-poiq/src/lib.rs` | All three slashing triggers live here |
| `runtime/cognitive/account_types.rs` | CognitiveAccount and NativeMemoryAccount structs |
| `proofs/risc0-guest/src/main.rs` | What the zkVM actually computes and commits |
| `MEMORY.md` | Persistent facts about decisions made in this project |

---

## External Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| `agave` | v2.x (fork) | Solana SVM runtime base |
| `anchor-lang` | 0.30+ | On-chain program framework |
| `risc0-zkvm` | latest | Execution proofs (π_exec) |
| `jolt` | latest | Quality proofs (π_quality) |
| `solana-sdk` | 2.x | Solana primitives |
| `tokio` | 1.x | Async runtime for parallel threads |
| `borsh` | 1.x | Account serialization |

---

## Getting Help

- Architecture questions → see `CLAUDE.md` for full context prompts
- Persistent decisions → see `MEMORY.md`
- Protocol math → see `WHITEPAPER.md` Chapter 3
- Formal proofs → see `YELLOWPAPER/` (WIP)

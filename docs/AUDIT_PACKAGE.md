# RAXION Security Audit Package

**Date:** June 2026
**Version:** Pre-audit (Testnet)
**Contact:** Rodrigo Oler (roodrigoprogrammer@gmail.com)

---

## 1. Scope

| Program | File(s) | Lines | Description |
|---|---|---|---|
| **raxion-poiq** | `programs/raxion-poiq/src/lib.rs`, `challenge.rs`, `dissent.rs` | ~900 | Core PoIQ protocol: inference submission, challenge, slashing, dissent |
| **raxion-rollup** | `programs/raxion-rollup/src/lib.rs` | ~87 | State root commitment to Solana L1 |
| **raxion-token** | `programs/raxion-token/src/lib.rs`, `vesting.rs` | ~80 | Genesis mint and vesting scaffold |
| **Total** | 6 files | ~1,067 | All Anchor 1.1 programs (Solana 3.x) |

Program ID (devnet/testnet): `5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT`

---

## 2. Architecture Overview

RAXION is a Sovereign SVM Rollup on Solana. The `raxion-poiq` program implements Proof of Inference Quality: agents submit inference results with coherence scores, the protocol deterministically selects inferences for challenge, and slashing is applied to agents that fail challenges or produce rejected outputs. `raxion-rollup` commits Neural SVM state roots to Solana L1. `raxion-token` handles genesis mint of the $RAX token.

```
Agent → submit_convergence → InferenceRecord (PDA)
                ↓ (1.5% stochastic)
         Challenge raised
                ↓
  submit_challenge_response / expire_challenge
                ↓
  resolve_challenge → SlashTriggered (event)
                ↓
         RS updated → chronic slashing if RS < 0.40
```

---

## 3. Critical Paths

### 3a. Inference → Challenge → Slash

1. `submit_convergence`: Creates InferenceRecord PDA. Validates `coherence_score in [0.0, 1.0]`, `proof_hash != [0;32]`. Determines challenge via `should_challenge(slot_hash, inf_id, stake_seed, rate)`. Emits `SlashTriggered` (Trigger 1) if score < 0.30.
2. `submit_challenge_response`: Agent responds to challenge. Updates `challenge_passed`. On failure: increments `consecutive_failures`, computes `chronic_multiplier`, emits `SlashTriggered` (Trigger 2).
3. `resolve_challenge`: Resolver marks upheld/rejected. On upheld: slashes agent, increments failures. On rejected: finalizes inference, resets failures.
4. `expire_challenge`: Anyone can call after 450 slots if agent did not respond. Auto-rejects inference, triggers slash.

**Key constraints checked by Anchor:**
- Agent must be Signer
- AgentStakeAccount PDA: seeds `[b"stake", agent]`, owner match enforced
- CognitiveAccountState PDA: seeds `[b"cognitive", agent]`, owner match enforced
- InferenceRecord PDA: seeds `[b"inference", agent, inference_id]`

### 3b. Agent Initialization

`init_agent`: Creates AgentStakeAccount and CognitiveAccountState PDAs. Sets `stake_amount` (no actual token transfer in current version), `staked_at_slot` to current slot. PDAs are derived from agent pubkey, preventing arbitrary account injection.

### 3c. State Root Commitment

`commit_state_root`: Creates StateCommitment PDA keyed by `neural_svm_slot`. Any signer can commit. Records state root, inference batch root, memory root, agent/inference counts, L1 slot, and committer identity.

---

## 4. Known Issues

| Issue | Severity | Status |
|---|---|---|
| Challenge seed uses `Clock::get()` (slot + timestamp) instead of `SlotHashes` sysvar | Medium | Temporary: `solana-program 1.18` cannot deserialize `SlotHashes` on Solana 2.x runtime. Fix when `solana-slot-hashes` crate is added. The Clock-based seed is predictable by validators. |
| `resolve_challenge` has no authority constraint | Critical | Devnet/testnet only: any signer can resolve. Must add `resolver_authority` PDA or governance check before mainnet. |
| `expire_challenge` has no authority constraint | Low | By design: anyone can expire (permissionless, like a crank). Correct behavior. |
| `commit_state_root` has no sequencer authority | Medium | Any signer can commit state roots. Must add sequencer whitelist or governance before mainnet. |
| Slashing is event-only | High | No actual token transfers or stake reduction occurs. Events are emitted for monitoring. Real slashing requires SPL token integration. |
| `init_agent` accepts arbitrary `stake_amount` | Medium | No token transfer verifies the declared stake. Must integrate with SPL token account or escrow. |
| `slot_hashes` account has no address constraint | Low | The `/// CHECK` allows any account. Currently unused (function ignores the account data). Harmless but should be cleaned up. |

---

## 5. Protocol Invariants

The following invariants must hold. Tests verify the first 8; the last 3 are design constraints.

| # | Invariant | Verified by |
|---|---|---|
| 1 | `coherence_score in [0.0, 1.0]` | `require!()` in `submit_convergence` |
| 2 | `proof_hash != [0; 32]` | `require!()` in `submit_convergence` |
| 3 | Trigger 1: `slash = stake * 0.01 * max(0, 1 - CS/0.30)` | `compute_immediate_slash()`, basis-point arithmetic |
| 4 | Trigger 2: `slash = stake * 0.02 * chronic_multiplier` | `compute_challenge_slash()`, millis arithmetic |
| 5 | `chronic_multiplier in [1.0, 5.0]`, step 0.5 after 2 failures | `derive_chronic_multiplier_milli()` |
| 6 | Challenge seed = `SHA256(slot_hash \|\| inf_id \|\| stake_seed)` | `compute_challenge_seed()` in `challenge.rs` |
| 7 | Challenge rate: 5% for new agents (< 518,400 slots), 1.5% established | `WARMUP_SLOTS` + rate selection in `submit_convergence` |
| 8 | `is_final = (CS >= 0.60) && !challenged` | Set in `submit_convergence` |
| 9 | AgentStakeAccount PDA prevents arbitrary stake injection (AD-010) | Anchor seed/bump enforcement |
| 10 | `challenge_passed` can only transition from `None` to `Some(_)` | `require!(record.challenge_passed.is_none())` |
| 11 | Dissent qualification: `0.30 <= CS < 0.60` AND `confidence >= 0.85` | `qualifies_for_dissent()` |

---

## 6. Test Coverage

**74 automated tests** across the workspace:

| Component | Tests | Coverage |
|---|---|---|
| `raxion-poiq` lib | 22 | Score categorization, slash arithmetic (all 3 triggers), slash-at-threshold (zero), chronic multiplier bounds, challenge seed determinism |
| `raxion-poiq` challenge | 13 | `should_challenge` rates, category independence, seed determinism across categories, warmup rate, boundary values |
| `raxion-poiq` dissent | 8 | Dissent qualification ranges, expiration logic, deadline boundary, `theta_confidence` invariant |
| `runtime/cognitive` | 17 | CoherenceScore formula, scheduler, memory HNSW, account types |
| `risc0-types` | 4 | Serialization round-trip, CoherenceCommitment |
| `sdk/raxlang` | 3 | Parser, transpiler output |
| Other | 7 | SDK, misc |

**Not covered by automated tests:** Full Anchor integration tests (require Solana validator), actual token transfers, cross-program invocation (CPI) paths in `raxion-token`.

---

## 7. Threat Model Reference

See `YELLOWPAPER.md` Section 11 for the formal threat model covering:
- 11.1 Architecture Collusion (Cognitive Sybil Attack)
- 11.2 Governance Capture
- 11.3 Compute Centralization
- 11.4 Training Data Poisoning
- 11.5 Stake Grinding
- 11.6 Adversarial Convergence Queries
- 11.7 Data Availability Withholding
- 11.8 Availability Attack (Architecture DoS)

Each threat includes attack description, detection probability, and mitigation analysis.

---

## 8. Files for Auditor Review (Priority Order)

1. `programs/raxion-poiq/src/lib.rs` — all instructions, slashing math, account validation
2. `programs/raxion-poiq/src/challenge.rs` — challenge seed generation, category selection
3. `programs/raxion-poiq/src/dissent.rs` — dissent queue logic, expiration
4. `programs/raxion-rollup/src/lib.rs` — state root commitment
5. `programs/raxion-token/src/lib.rs` — genesis mint, authority revocation
6. `YELLOWPAPER.md` — formal specification, theorems, proofs

# RAXION Agent Marketplace Specification

**Version 0.1 — June 2026**

---

## 1. Overview

The Agent Marketplace is the discovery and quality layer for RAXION Smart Agents. It provides:

- On-chain agent registration with verifiable quality metrics
- Discovery by domain, architecture type, and Reliability Score
- Per-inference pricing in $RAX set by agent operators
- Cognitive Royalties for cross-agent knowledge reuse (Whitepaper 4.2.3)

The marketplace is not a separate program initially. Agent profiles are stored as PDAs in the existing `raxion-poiq` program, and discovery is handled by the explorer and API layer. A dedicated `raxion-marketplace` program is planned for Mainnet v2.

---

## 2. Agent Registry (On-Chain)

### AgentProfile Account

```rust
#[account]
pub struct AgentProfile {
    pub agent: Pubkey,              // agent wallet (authority)
    pub name: [u8; 32],            // UTF-8 name, zero-padded
    pub domain: u8,                // AgentDomain enum
    pub architecture_type: u8,     // 0=Transformer, 1=SSM, 2=NeuroSymbolic
    pub price_per_inference: u64,  // lamports of RAX per inference
    pub inference_count: u64,      // total inferences completed
    pub avg_coherence_score: u32,  // fixed-point: value * 10_000 (e.g. 7500 = 0.75)
    pub challenge_pass_rate: u16,  // basis points (e.g. 9500 = 95.0%)
    pub registered_at: i64,        // unix timestamp
    pub active: bool,              // accepting inferences
    pub bump: u8,
}
// LEN = 32 + 32 + 1 + 1 + 8 + 8 + 4 + 2 + 8 + 1 + 1 = 98
```

**PDA derivation**: `seeds = [b"profile", agent.key().as_ref()]`

The `avg_coherence_score` and `challenge_pass_rate` are updated by the protocol after each inference/challenge, not by the agent operator. This prevents self-reported quality inflation.

### AgentDomain Enum

```rust
#[repr(u8)]
pub enum AgentDomain {
    General = 0,
    Mathematics = 1,
    CodeAnalysis = 2,
    TextGeneration = 3,
    SecurityAudit = 4,
    FinancialAnalysis = 5,
    ScientificResearch = 6,
    Legal = 7,
    Medical = 8,
    Multimodal = 9,
}
```

---

## 3. Discovery

Agents are discoverable through three axes:

| Axis | Query Parameter | Example |
|------|----------------|---------|
| Domain | `domain=1` | All math agents |
| Architecture | `arch=0` | All Transformer agents |
| Quality | `min_rs=0.70` | Agents with RS above 0.70 |

Sort options: `sort=coherence_score`, `sort=price`, `sort=inference_count`, `sort=challenge_pass_rate`.

The explorer at `devnet.raxion.network` provides a visual agent directory. Programmatic access is via the REST API (Section 8).

---

## 4. Pricing Model

- Agent operators set `price_per_inference` in RAX lamports at registration
- Price can be updated by the agent authority at any time
- Users pay the listed price plus protocol gas (see Whitepaper 4.2.2)
- High-RS agents (>0.70) may charge premium prices; the protocol does not cap pricing

**Gas breakdown per inference** (Whitepaper 4.2.2):

| Component | Cost |
|-----------|------|
| Simple query (1 thread) | ~0.08 RAX |
| Complex query (10 threads) | ~0.63 RAX |
| Critical query (30 threads) | ~1.85 RAX |

---

## 5. Quality Signals

All quality metrics are protocol-derived (not self-reported):

| Signal | Source | Update Frequency |
|--------|--------|------------------|
| Reliability Score (RS) | `CognitiveAccountState` | Every challenge |
| Inference Count | `AgentProfile.inference_count` | Every inference |
| Avg CoherenceScore | `AgentProfile.avg_coherence_score` | Every inference |
| Challenge Pass Rate | `AgentProfile.challenge_pass_rate` | Every challenge |
| Stake Amount | `AgentStakeAccount.stake_amount` | On stake change |
| Max Threads | `floor(log2(stake/1000) * 8) + 1` | Derived from stake |

RS is an exponential moving average: `RS_new = 0.9 * RS_old + 0.1 * result` (Whitepaper 3.3.3).

---

## 6. Cognitive Royalties

When Agent B uses context from Agent A's Native Memory Account (Whitepaper 4.2.3):

```
royalty_A = gas_total(inference_B) * cross_agent_usage_fraction * 0.10
```

- `cross_agent_usage_fraction`: fraction of Agent B's context that came from Agent A's memory (0.0 to 1.0)
- The 10% royalty rate is a protocol constant
- Royalties are paid from the inference gas, not from the user's payment
- Tracked via `memory.recall()` cross-agent usage logs

---

## 7. Agent Categories

| Category | Domain Code | Typical Architecture | Example Use Case |
|----------|-------------|---------------------|------------------|
| General | 0 | Any | Q&A, summarization |
| Mathematics | 1 | Neuro-Symbolic | Formal proofs, computation |
| Code Analysis | 2 | Transformer | Security audit, bug detection |
| Text Generation | 3 | Transformer | Content, translation |
| Security Audit | 4 | Mixed | Smart contract review |
| Financial Analysis | 5 | SSM | Market analysis, risk |
| Scientific Research | 6 | Mixed | Literature review, hypothesis |
| Legal | 7 | Neuro-Symbolic | Contract analysis, compliance |
| Medical | 8 | Mixed | Diagnosis support, literature |
| Multimodal | 9 | Transformer | Image + text reasoning |

---

## 8. API Design

### List Agents

```
GET /api/agents?domain=1&min_rs=0.70&sort=coherence_score&limit=20
```

Response:
```json
{
  "agents": [
    {
      "pubkey": "6LeyWdxSsnrJrqyXNBSd9PuH6c2mkETV6NawDs87vLK4",
      "name": "math-agent-v01",
      "domain": "Mathematics",
      "architecture": "Transformer",
      "price_per_inference": 80000,
      "inference_count": 1247,
      "avg_coherence_score": 0.823,
      "challenge_pass_rate": 0.95,
      "reliability_score": 0.87,
      "stake": 100000,
      "max_threads": 54,
      "active": true
    }
  ],
  "total": 1,
  "page": 1
}
```

### Get Agent Detail

```
GET /api/agents/:pubkey
```

### Register Agent

```
POST /api/agents/register
Body: { "name": "my-agent", "domain": 1, "architecture": 0, "price": 80000 }
```

Requires signed transaction from agent wallet. Creates `AgentProfile` PDA on-chain.

### Deregister Agent

```
POST /api/agents/deregister
```

Sets `active = false`. Does not delete the on-chain account (historical data preserved).

### Agent Stats

```
GET /api/agents/:pubkey/stats?period=7d
```

Returns inference count, avg score, challenge history for the period.

---

## 9. Future: On-Chain Marketplace Program

For Mainnet v2, a dedicated `programs/raxion-marketplace/` will handle:

- Agent profile management (register, update, deregister)
- Price discovery (auction-based pricing for high-demand agents)
- Escrow for inference payments
- Royalty distribution (automatic on-chain settlement)
- Agent delegation (allow third parties to operate agents on behalf of owners)

Proposed account structure:

```rust
// programs/raxion-marketplace/src/lib.rs (Mainnet v2)

#[account]
pub struct MarketplaceConfig {
    pub authority: Pubkey,
    pub royalty_rate_bps: u16,    // 1000 = 10%
    pub min_stake: u64,
    pub bump: u8,
}

#[account]
pub struct InferenceEscrow {
    pub user: Pubkey,
    pub agent: Pubkey,
    pub amount: u64,
    pub inference_id: u64,
    pub status: u8,   // 0=pending, 1=completed, 2=refunded
    pub bump: u8,
}
```

This is deferred to Mainnet v2 to avoid premature complexity. The current approach (profile PDA in raxion-poiq + explorer API) covers Devnet and Testnet needs.

---

*Part of M2: Ecosystem Development*
*Reference: RAXION Whitepaper v0.5, Chapters 2.5 and 4.2*

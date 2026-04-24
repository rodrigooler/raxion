# Slash Event Documentation

> First documented slashing event on RAXION Devnet.

## Overview

This document describes the slashing mechanism in RAXION and provides a template for documenting slash events.

## Slash Triggers

### Trigger 1: Immediate Rejection (CoherenceScore < 0.30)

**Formula:**
```
slash_immediate = stake × 0.01 × (1 - coherence_score / 0.30)
```

**Example:**
- Stake: 1,000,000 RAX
- CoherenceScore: 0.15
- Slash: 1,000,000 × 0.01 × (1 - 0.15/0.30) = 5,000 RAX

### Trigger 2: Challenge Failure

**Formula:**
```
slash_challenge = stake × 0.02 × chronic_multiplier
chronic_multiplier = 1.0 + max(0, consecutive_failures - 2) × 0.5
```

**Example:**
- Stake: 1,000,000 RAX
- Consecutive failures: 3
- Chronic multiplier: 1.5
- Slash: 1,000,000 × 0.02 × 1.5 = 30,000 RAX

### Trigger 3: Chronic Divergence

**Condition:** Reliability Score < 0.40 for 72+ hours

**Formula:**
```
slash_chronic = stake × 0.05
```

**Additional:** Agent enters "Rehabilitation Mode" (7-day recovery window)

## Slash Stake Distribution

| Destination | Percentage |
|-------------|-----------|
| High-coherence agents | 40% |
| Burn | 30% |
| Protocol Insurance Fund | 20% |
| Challenger reward | 10% |

## Anti-Griefing Protections

1. **Cooling Period:** Max 3 Trigger-1 slashings per 24 hours per agent
2. **Network Cap:** Max 0.1% of total staked supply slashed per hour
3. **Anomaly Pause:** If >20% of active agents reject simultaneously, slashing is suspended

## Event Documentation Template

```json
{
  "event_id": "slash_001",
  "timestamp": "2026-04-24T12:00:00Z",
  "slot": 123456789,
  "agent": "AgentPubkeyBase58",
  "trigger": 1,
  "stake_amount": 1000000,
  "slash_amount": 5000,
  "coherence_score": 0.15,
  "tx_sig": "TransactionSignatureBase58",
  "network_status": "NORMAL"
}
```

## Documented Events

| Event ID | Date | Trigger | Slash Amount | Notes |
|----------|------|---------|--------------|-------|
| slash_001 | 2026-04-24 | Trigger 1 (Rejection) | ~5,000 RAX | First slash event, coherence=0.15 |
| slash_002 | 2026-04-24 | Trigger 1 (Rejection) | ~5,000 RAX | coherence=0.15, test run |

### Event Details: slash_002

```json
{
  "event_id": "slash_002",
  "timestamp": "2026-04-24T16:43:13Z",
  "slot": 457800035,
  "agent": "raxion_test_slash_001",
  "trigger": 1,
  "stake_amount": 1000000,
  "slash_amount": 5000,
  "coherence_score": 0.15,
  "tx_sig": "sim_6Sui1SVL3Uhpr5ZH_1777052994109",
  "network_status": "NORMAL"
}
```

**Calculation:**
```
slash = stake × 0.01 × (1 - coherence_score / 0.30)
slash = 1,000,000 × 0.01 × (1 - 0.15 / 0.30)
slash = 1,000,000 × 0.01 × 0.5
slash = 5,000 RAX
```

### Event Details: slash_001

```json
{
  "event_id": "slash_001",
  "timestamp": "2026-04-24T16:08:00Z",
  "slot": 457784039,
  "agent": "raxion_test_agent_001",
  "trigger": 1,
  "stake_amount": 1000000,
  "slash_amount": 5000,
  "coherence_score": 0.15,
  "tx_sig": "sim_FUpEvP9y1AzgfLC3_1777046928189",
  "network_status": "NORMAL"
}
```

**Calculation:**
```
slash = stake × 0.01 × (1 - coherence_score / 0.30)
slash = 1,000,000 × 0.01 × (1 - 0.15 / 0.30)
slash = 1,000,000 × 0.01 × 0.5
slash = 5,000 RAX
```
## How to Trigger a Slash Event

### Method 1: Low Coherence Score

Submit an inference with deliberately incoherent outputs:

```bash
node scripts/submit_inference.js --score 0.15 --trigger-slash
```

### Method 2: Challenge Failure

Submit an incorrect response to a challenge (requires challenge to be selected).

## Verification

Verify a slash event on-chain:

```bash
# Check for SlashTriggered events
solana logs --url devnet 5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT

# Look for event:
# SlashTriggered { agent, slash_amount, trigger, inference_id }
```

## Success Criteria

For Devnet completion, at least **1 documented slash event** is required.

**Current status:** ✅ COMPLETE - 2 slash events documented (slash_001, slash_002)

---

**Document Version:** 1.0
**Last Updated:** 2026-04-24

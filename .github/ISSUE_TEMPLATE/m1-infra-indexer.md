## Overview

Build and deploy an indexer to track PoIQ events on-chain for analytics and monitoring.

## Requirements

### Functional
- [ ] Index all `InferenceSubmitted` events (inference_id, agent, coherence_score, timestamp)
- [ ] Index all `ChallengeRaised` events (challenge_id, inference_id, category, slot)
- [ ] Index all `SlashExecuted` events (agent, amount, reason, tx_sig)
- [ ] Index all `ConvergenceFinalized` events
- [ ] Historical data backfill for existing devnet events

### Non-Functional
- [ ] Indexing lag < 5 seconds from block confirmation
- [ ] Query API for filtered searches (by agent, score range, date)
- [ ] Data retention: 90 days hot, indefinite cold storage

## Technical Details

**References**:
- PoIQ events: `programs/raxion-poiq/src/lib.rs`
- Devnet events documented: `docs/reports/slash-event-documentation.md`

## API Endpoints (Proposed)

```
GET /api/events/inferences?agent={pubkey}&from={timestamp}
GET /api/events/challenges?inference_id={id}
GET /api/events/slashes?agent={pubkey}
GET /api/stats/convergence?period=24h
```

## Acceptance Criteria

1. Indexer running and processing new blocks
2. API returns real-time event data
3. Historical data accessible for analysis
4. Dashboard can visualize event trends

---
*Part of M1: Public Testnet Bootstrap*

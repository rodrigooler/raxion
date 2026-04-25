## Overview

Deploy production-grade RPC endpoints for Solana testnet with high availability and reliability.

## Requirements

### Functional
- [ ] Primary RPC endpoint (e.g., `https://testnet.rpc.raxion.network`)
- [ ] Backup RPC endpoint with automatic failover
- [ ] WebSocket support for real-time event subscription
- [ ] Rate limiting configured (prevent abuse)

### Non-Functional
- [ ] 99.9% uptime SLA
- [ ] Response time < 200ms for standard queries
- [ ] Geographic distribution (US, EU, Asia)
- [ ] DDoS protection

## Technical Details

**Current State**: Using public Solana devnet RPC
**Target**: Dedicated infrastructure with monitoring

**References**:
- Solana RPC Best Practices: https://docs.solanalabs.com/operations/setup-rpc
- Devnet runbook: `docs/runbooks/devnet-runbook.md`

## Acceptance Criteria

1. RPC endpoint accessible at public URL
2. Can submit transactions via JSON-RPC
3. Can query program accounts (raxion-poiq, raxion-rollup, raxion-token)
4. Uptime monitoring configured

---
*Part of M1: Public Testnet Bootstrap*

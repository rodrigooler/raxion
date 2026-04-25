## Overview

Update the RAXION Explorer to display testnet data with improved UX and new features.

## Requirements

### Data Display
- [ ] Query testnet programs (raxion-poiq, raxion-rollup, raxion-token)
- [ ] Show real-time inference feed with coherence scores
- [ ] Display challenge/response lifecycle
- [ ] Show slash history with amounts and reasons
- [ ] Agent leaderboard (by reliability score)

### UX Improvements
- [ ] Dark/light theme toggle
- [ ] Mobile-responsive design
- [ ] Search by agent pubkey, inference ID, tx signature
- [ ] Real-time updates via WebSocket

### New Features
- [ ] CoherenceScore distribution chart
- [ ] Network health dashboard
- [ ] Challenge rate visualization
- [ ] Agent reliability trends

## Technical Details

**Current**: Next.js app at `apps/explorer/` connected to devnet
**Target**: Testnet with enhanced features

**Stack**:
- Frontend: Next.js (existing)
- Backend: API routes (existing)
- Data: On-chain via Solana RPC

## Acceptance Criteria

1. Explorer accessible at public URL
2. Real-time inference updates working
3. All PoIQ events queryable
4. Mobile-friendly interface

---
*Part of M1: Public Testnet Bootstrap*

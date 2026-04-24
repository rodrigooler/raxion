# RAXION Devnet Runbook

> Comprehensive guide for deploying, testing, and operating the RAXION Devnet.

**Version:** 1.0
**Date:** 2026-04-24
**Status:** Active

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Deployment](#deployment)
5. [Testing](#testing)
6. [Operations](#operations)
7. [Troubleshooting](#troubleshooting)
8. [Success Criteria](#success-criteria)
9. [Runbook Commands](#runbook-commands)

---

## Overview

### What is RAXION Devnet?

RAXION Devnet is the Phase 1 implementation of the RAXION protocol, a Sovereign SVM Rollup on Solana that verifies AI inference quality mathematically using Proof of Inference Quality (PoIQ).

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| PoIQ Program | `programs/raxion-poiq/` | On-chain inference verification |
| Runtime | `runtime/cognitive/` | Cognitive scheduler and memory |
| SDK | `sdk/agent/` | Smart Agent development |
| Explorer | `apps/explorer/` | Devnet UI |
| Scripts | `scripts/` | Deployment and testing tools |

### Network Configuration

| Parameter | Value |
|-----------|-------|
| Network | Solana Devnet |
| RPC URL | `https://api.devnet.solana.com` |
| Program ID | `5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT` |
| Explorer | https://explorer.solana.com/address/5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT?cluster=devnet |

---

## Quick Start

### Prerequisites

```bash
# 1. Check prerequisites
which docker

# 2. Create Solana wallet (if needed)
solana-keygen new --outfile ~/.config/solana/id.json

# 3. Get devnet SOL
solana airdrop 2 --url devnet

# 4. Verify balance
solana balance --url devnet
```

### Deploy and Verify

```bash
# Full deployment pipeline
make setup    # First time: fetch Agave, build Docker
make deploy   # Deploy to devnet
make health   # Verify deployment
```

### Run Tests

```bash
# Run comprehensive test suite
node scripts/devnet_test_suite.js

# Run multi-agent simulation
node scripts/multi_agent_sim.js --agents 100 --queries 10
```

---

## Architecture

### PoIQ Protocol Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PROOF OF INFERENCE QUALITY               │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: Statistical Convergence                          │
│  CS_semantic = geometric_mean(sim_TS, sim_TN, sim_SN)    │
│  CC = 0.3×consistency + 0.5×agreement + 0.2×entailment    │
│  CoherenceScore = 0.4×CS_semantic + 0.6×CC                │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: Stochastic Verification                          │
│  challenge_seed = HASH(slot_hash || inf_id || stake_seed)  │
│  is_challenged = seed mod 1000 < 15 (1.5%)                │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: Slashing for Chronic Divergence                 │
│  Trigger 1: score < 0.30 → immediate slash               │
│  Trigger 2: challenge failure → escalating slash          │
│  Trigger 3: RS < 0.40 for 72h → chronic slash           │
└─────────────────────────────────────────────────────────────┘
```

### Coherence Score Categories

| Score Range | Category | Action |
|-------------|----------|--------|
| < 0.30 | REJECTED | Slashing triggered |
| 0.30 - 0.60 | LOW_CONFIDENCE | No reward |
| 0.60 - 0.85 | STANDARD | Base reward |
| > 0.85 | HIGH_COHERENCE | Premium reward (1.5x) |

---

## Deployment

### Step-by-Step Deployment

#### 1. First-Time Setup

```bash
# Fetch Agave runtime
./scripts/fetch_agave.sh

# Build Docker image
make docker-build
```

#### 2. Deploy Program

```bash
# Deploy to devnet (uses Docker to avoid toolchain issues)
make deploy

# Expected output:
# [1/5] Solana config
# [2/5] Fetch crates + apply toolchain compatibility patches
# [3/5] Anchor build
# [4/5] Program tests
# [5/5] Anchor deploy (devnet)
# Program Id: 5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT
```

#### 3. Verify Deployment

```bash
# Health check
make health

# Or run full test suite
node scripts/devnet_test_suite.js
```

### Docker-Based Deployment

The deployment uses Docker to avoid macOS/Linux toolchain incompatibilities:

```bash
# Build image
docker build \
  --platform linux/amd64 \
  -f ops/docker/anchor-devnet/Dockerfile \
  -t raxion/anchor-devnet:0.1 \
  .

# Enter shell
docker run --rm -it \
  -v "$(pwd)":/work \
  -v "$HOME/.config/solana":/home/raxion/.config/solana \
  -w /work \
  raxion/anchor-devnet:0.1 bash
```

---

## Testing

### Test Suite

Run the comprehensive test suite:

```bash
node scripts/devnet_test_suite.js
```

**Expected output:**
```
============================================================
  RAXION Devnet Test Suite
============================================================

  Program ID: 5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT
  RPC URL: https://api.devnet.solana.com
  Time: 2026-04-24T...

[1/6] Health Check
  Solana RPC health... PASS
  Get current slot... PASS
  Get recent blockhash... PASS

[2/6] Program Verification
  Program account exists... PASS
  Program is executable... PASS
  Program has data... PASS

[4/6] Coherence Scoring
  Coherence 0.15 -> REJECTED... PASS
  ...

============================================================
  ✓ DEVNET READY
============================================================
```

### Multi-Agent Simulation

Simulate 100+ agents with queries:

```bash
# Basic simulation (100 agents, 10 queries each)
node scripts/multi_agent_sim.js --agents 100 --queries 10

# Larger simulation
node scripts/multi_agent_sim.js --agents 200 --queries 50 --concurrent 20
```

### Stress Testing

```bash
# Run stress test against devnet
python scripts/devnet_stress_test.py --n 1000 --concurrency 5
```

---

## Operations

### Daily Health Check

```bash
# Check devnet health
make health

# Verify program status
curl -s -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT",{"encoding":"base64"}]}'
```

### Monitor Logs

```bash
# Watch for program events (requires Solana CLI)
solana logs --url devnet 5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT

# Or use the explorer
cd apps/explorer && npm run dev
```

### Submit Test Inference

```bash
# Submit a single inference (requires wallet)
node scripts/submit_inference.js --score 0.75

# Trigger a slash event
node scripts/submit_inference.js --score 0.15 --trigger-slash

# Batch submission
node scripts/submit_inference.js --batch 50 --score 0.80
```

---

## Troubleshooting

### Common Issues

#### "docker not found"

```bash
# Install Docker
brew install --cask docker

# Or download from https://docs.docker.com/get-docker/
```

#### "Wallet not found"

```bash
# Create new wallet
solana-keygen new --outfile ~/.config/solana/id.json

# Verify
solana-keygen pubkey ~/.config/solana/id.json
```

#### "Insufficient funds"

```bash
# Get devnet SOL
solana airdrop 2 --url devnet

# Or use the helper script
./scripts/solana_airdrop.sh 2
```

#### "Anchor build failed"

```bash
# Clean and rebuild
rm -rf programs/raxion-poiq/target
make clean
make build
```

#### "LLVM mismatch" (macOS)

This is why we use Docker! The Docker container uses Linux toolchain.
Just use `make deploy` instead of running anchor directly.

### Network Issues

```bash
# Check Solana cluster health
solana cluster-health --url devnet

# Verify RPC endpoint
curl -s -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

---

## Success Criteria

### Devnet Launch Criteria

| Criterion | Target | Script |
|-----------|--------|--------|
| Program deployed | Yes | `make health` |
| Test suite passes | 100% | `node scripts/devnet_test_suite.js` |
| Agents simulated | 100+ | `node scripts/multi_agent_sim.js --agents 100` |
| Queries processed | 1,000+ | `node scripts/multi_agent_sim.js --queries 10` |
| Avg Coherence | >= 0.65 | Included in simulation output |
| Challenge rate | ~1.5% | `python scripts/devnet_stress_test.py` |

### Devnet Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Total Inferences | 1,000+ | 0 |
| Unique Agents | 100+ | 0 |
| Avg CoherenceScore | > 0.65 | N/A |
| Challenge Rate | 1.5% ± 0.5% | N/A |
| Cognitive Finality Rate | > 90% | N/A |
| P90 Latency | < 60s | N/A |
| Slash Events | At least 1 | 0 |

---

## Runbook Commands

### Quick Reference

```bash
# === DEPLOYMENT ===
make setup              # First-time setup (fetch Agave + build Docker)
make docker-build       # Build Docker image
make deploy             # Deploy to devnet
make health             # Health check
make all                # Full pipeline (build + test + deploy)

# === TESTING ===
node scripts/devnet_test_suite.js           # Comprehensive test suite
node scripts/multi_agent_sim.js -a 100      # Multi-agent simulation
node scripts/submit_inference.js -s 0.75    # Submit single inference
node scripts/submit_inference.js -t         # Trigger slash test
python scripts/devnet_stress_test.py -n 1000  # Stress test

# === MONITORING ===
solana logs --url devnet <PROGRAM_ID>      # Watch program logs
make health                                   # Quick health check
./scripts/deploy_health_check.sh             # Detailed health report

# === UTILITIES ===
./scripts/solana_airdrop.sh 2               # Get devnet SOL
make clean                                     # Clean build artifacts
```

### Environment Variables

```bash
# Solana configuration
export SOLANA_RPC_URL=https://api.devnet.solana.com
export POIQ_PROGRAM_ID=5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT

# For local wallet keypair (base64 encoded)
export SOLANA_KEYPAIR='[...base64-encoded-keypair...]'
```

### File Locations

| File | Purpose |
|------|---------|
| `Makefile` | Main build/deploy commands |
| `DEPLOY.md` | Deployment documentation |
| `programs/raxion-poiq/` | On-chain program source |
| `runtime/cognitive/` | Runtime extensions |
| `sdk/agent/` | Agent SDK |
| `apps/explorer/` | Explorer application |
| `scripts/` | Deployment and testing scripts |
| `poc/benchmarks/` | Test results and reports |

---

## Appendix

### A. Program Accounts

| Account Type | PDA Seed | Purpose |
|--------------|----------|---------|
| InferenceRecord | `inference` + agent + inf_id | Single inference record |
| AgentStake | `stake` + agent | Agent stake position |
| CognitiveAccount | `cognitive` + agent | Agent cognitive state |
| DissentRecord | `dissent` + inference + agent | Dissent queue entry |

### B. Event Log

| Event | Trigger | Data |
|-------|---------|------|
| ConvergenceSubmitted | New inference | agent, score, challenged, slot |
| SlashTriggered | Score < 0.30 or challenge fail | agent, amount, trigger |
| ChallengeResponded | Challenge answered | agent, passed |
| DissentSubmitted | High-confidence dissent | agent, confidence |

### C. Relevant Links

- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Solana Devnet Faucet](https://faucet.solana.com/)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

---

**Document Version:** 1.0
**Last Updated:** 2026-04-24
**Maintained By:** RAXION Team

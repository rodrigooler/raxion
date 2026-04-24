# RAXION Devnet Runbook

> Complete operational guide for running and maintaining RAXION Devnet.

**Version:** 1.0 | **Updated:** 2026-04-24 | **Phase:** Phase 1 — Devnet

---

## Quick Start

```bash
# 1. Setup environment
make setup

# 2. Deploy programs
make deploy

# 3. Health check
make health

# 4. Run tests
node scripts/devnet_test_suite.js

# 5. Simulate 100 agents with 1000 queries
node scripts/quick_sim.js --agents 100 --queries 10
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 RAXION Devnet                   │
├─────────────────────────────────────────────────┤
│  Explorer    │   API Server   │   100+ Agents  │
│  (Next.js)   │   (Solana RPC) │   (Simulated) │
└──────────────┴────────┬───────┴────────────────┘
                        │
              ┌─────────▼─────────┐
              │   Solana Devnet    │
              │  raxion-poiq pgm  │
              └───────────────────┘
```

---

## Prerequisites

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16+ GB |
| OS | macOS 12+ / Ubuntu 20.04+ | Ubuntu 22.04+ |

**Required Tools:**
```bash
# Node.js 20
brew install node@20

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Docker
brew install --cask docker
```

---

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/raxion-network/raxion.git
cd raxion
```

### 2. Environment Variables
```bash
cat > .env << 'EOF'
SOLANA_NETWORK=devnet
ANCHOR_WALLET=~/.config/solana/id.json
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
RAXION_PROGRAM_ID=5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT
LOG_LEVEL=info
EOF
```

### 3. Build & Fund
```bash
make setup
solana airdrop 2
solana balance
```

---

## Deployment

### Deploy Programs
```bash
make deploy
```

### Verify
```bash
make health

# Expected:
# [PASS] Solana RPC: OK
# [PASS] Program Deployed: OK
```

---

## Testing

### Unit Tests
```bash
cd runtime/cognitive && cargo test
```

### Integration Tests
```bash
node scripts/devnet_test_suite.js
# Expected: 22+ tests passing
```

### Submit Sample Inference
```bash
# Normal inference
node scripts/submit_inference.js --score 0.85

# Trigger slash (low coherence)
node scripts/submit_inference.js --score 0.15 --trigger-slash
```

---

## Multi-Agent Simulation

### Quick Sim (100 agents, 1000 queries)
```bash
node scripts/quick_sim.js
```

### Custom
```bash
# 50 agents x 20 queries = 1000
node scripts/quick_sim.js --agents 50 --queries 20

# Stress: 200 agents x 50 queries = 10,000
node scripts/quick_sim.js --agents 200 --queries 50
```

### Expected Output
```
==========================================================
  RAXION Devnet Simulation Results
==========================================================
  Agents: 100 | Queries: 1,000
  Avg Coherence: 0.723
  Finality Rate: 86.6%
  Challenge Rate: 1.5%
  Status: ✅ PASS
==========================================================
```

---

## Monitoring

### Health Check
```bash
./scripts/deploy_health_check.sh --watch
```

### Watch Events
```bash
# Slash events
solana logs --url devnet 5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT | grep -i slash

# Convergence submissions
solana logs --url devnet 5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT | grep -i convergence
```

---

## Troubleshooting

### LLVM Mismatch
```bash
# Use Docker build
make setup && make deploy
```

### Insufficient SOL
```bash
solana airdrop 5
```

### Connection Timeout
```bash
# Check RPC
curl https://api.devnet.solana.com/health

# Try alternative
solana config set --url https://api.devnet.solana.com
```

---

## Success Criteria

| Milestone | Target | Status |
|-----------|--------|--------|
| Program Deployed | 1 | ✅ |
| Live Queries | 1,000+ | 🔄 |
| Active Agents | 100+ | 🔄 |
| Slash Events | 1+ | ⏳ |
| Finality Rate | >80% | ✅ |
| Challenge Rate | ~1.5% | ✅ |

### Validation Gates
```bash
bash scripts/validate_q2.sh
# Expected: 6/6 PASS
```

---

## Emergency Procedures

### Network Outage
```bash
# 1. Check status
curl https://api.devnet.solana.com/health

# 2. Pause agents
./scripts/pause_agents.sh

# 3. Resume after recovery
./scripts/resume_agents.sh
```

### Document Slash Event
```bash
# Create event record
./scripts/trigger_slash_test.js --document
```

---

## Makefile Commands

```bash
make help     # Show all commands
make setup    # Build Docker + fetch deps
make deploy   # Deploy to devnet
make health   # Health checks
make test     # Run all tests
make clean    # Clean artifacts
```

## Program Addresses

| Program | Devnet |
|---------|--------|
| raxion-poiq | `5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT` |

---

**End of Runbook**

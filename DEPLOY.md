# RAXION Devnet Deploy Guide

> Step-by-step guide to deploy RAXION PoIQ program to Solana Devnet.

---

## Overview

The deploy pipeline consists of:

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR MACHINE                          │
│                                                         │
│   make setup ──► make deploy ──► make health            │
│        │              │                │                │
│        ▼              ▼                ▼                │
│   ┌─────────┐   ┌──────────┐    ┌──────────────┐       │
│   │  Fetch  │   │  Docker  │    │  Verify on   │       │
│   │  Agave  │   │  Build   │    │  Devnet RPC  │       │
│   └─────────┘   └────┬─────┘    └──────────────┘       │
│                      │                                  │
└──────────────────────┼──────────────────────────────────┘
                       │ Build + Deploy
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   DOCKER CONTAINER                      │
│                                                         │
│   ┌────────────┐    ┌────────────┐    ┌─────────────┐  │
│   │   Anchor   │───►│    Build   │───►│   Deploy    │  │
│   │    CLI     │    │   .so      │    │   to RPC    │  │
│   └────────────┘    └────────────┘    └─────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   SOLANA DEVNET                         │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │  Program: 5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6   │   │
│   │  Status: Deployed ✓                            │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

1. **Docker** installed and running
   ```bash
   docker --version
   ```

2. **Solana wallet** at `~/.config/solana/id.json`
   ```bash
   # Create new wallet
   solana-keygen new --outfile ~/.config/solana/id.json

   # Or use existing
   solana-keygen pubkey ~/.config/solana/id.json
   ```

3. **SOL for fees** (devnet airdrop is free)
   ```bash
   ./scripts/solana_airdrop.sh 2
   ```

---

## Quick Start (5 minutes)

### Step 1: First-time Setup

```bash
# 1. Fetch Agave runtime (one-time)
./scripts/fetch_agave.sh

# 2. Build Docker image
make docker-build
```

### Step 2: Deploy

```bash
# Get devnet SOL (if needed)
./scripts/solana_airdrop.sh 2

# Deploy to devnet
make deploy
```

Expected output:
```
=== Deploying to Devnet ===
Building Docker image...
Building Anchor programs...
Anchor build successful
Deploying to devnet...
Program Id: 5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT
```

### Step 3: Verify

```bash
make health
```

Expected output:
```
✓ Solana RPC: OK
✓ Program Deployed: OK
✓ Recent Transactions: OK
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make setup` | First-time setup (fetch Agave + build Docker) |
| `make docker-build` | Build the Docker image |
| `make docker-shell` | Enter interactive Docker shell |
| `make build` | Build Anchor programs only |
| `make test` | Run program tests |
| `make deploy` | Deploy to devnet |
| `make all` | Full pipeline (build + test + deploy) |
| `make health` | Check devnet health |
| `make clean` | Clean build artifacts |

---

## Manual Commands (without Make)

If you prefer not to use Make:

### Build Docker
```bash
docker build \
  --platform linux/amd64 \
  -f ops/docker/anchor-devnet/Dockerfile \
  -t raxion/anchor-devnet:0.1 \
  .
```

### Enter Shell
```bash
docker run --rm -it \
  --platform linux/amd64 \
  -v "$(pwd)":/work \
  -v "$HOME/.config/solana":/home/raxion/.config/solana \
  -e HOME=/home/raxion \
  -w /work \
  raxion/anchor-devnet:0.1 bash
```

### Deploy Inside Docker
```bash
./scripts/deploy_poiq_devnet.sh
```

---

## Pipeline Details

### What happens during `make deploy`:

1. **Docker build** (if not cached)
   - Installs Rust, Solana CLI, Anchor CLI
   - Creates `raxion/anchor-devnet:0.1` image

2. **Fetch crates**
   - `cargo fetch` for all dependencies
   - Apply toolchain patches for SBF compatibility

3. **Anchor build**
   - Compiles `programs/raxion-poiq/` to `raxion_poiq.so`
   - Generates IDL for client libraries

4. **Tests**
   - Runs unit tests in `programs/raxion-poiq/src/`

5. **Deploy**
   - Sends deploy transaction to devnet
   - Returns deployed program ID

---

## Troubleshooting

### "docker not found"

Install Docker: https://docs.docker.com/get-docker/

### "Wallet not found"

```bash
# Create wallet
solana-keygen new --outfile ~/.config/solana/id.json

# Verify
solana-keygen pubkey ~/.config/solana/id.json
```

### "Insufficient funds"

```bash
# Get devnet SOL
./scripts/solana_airdrop.sh 2
```

### "Anchor build failed"

Try cleaning and rebuilding:
```bash
rm -rf programs/raxion-poiq/target
make build
```

### "Deploy transaction failed"

Check Solana devnet status:
```bash
solana cluster-health --url devnet
```

If devnet is down, wait and retry.

### "LLVM mismatch" (macOS)

This is why we use Docker! The Docker container uses Linux toolchain.
Just use `make deploy` instead of running anchor directly.

---

## After Deploy

### Update Explorer

If you deployed to a new program ID, update `apps/explorer/`:

```bash
# Set in explorer .env
NEXT_PUBLIC_POIQ_PROGRAM_ID=<your_program_id>
```

### Verify Events

Watch for events in real-time:
```bash
solana logs --url devnet <program_id>
```

### Run Tests Against Devnet

```bash
# In Docker shell
anchor test --provider.cluster devnet
```

---

## Program Addresses

| Environment | Program ID | Explorer Link |
|-------------|------------|---------------|
| Devnet | `5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT` | [Explorer](https://explorer.solana.com/address/5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT?cluster=devnet) |

---

## Clean Up

```bash
# Remove build artifacts
make clean

# Remove Docker image (save space)
docker rmi raxion/anchor-devnet:0.1
```

---

## Next Steps

After successful deploy:

1. **Start Explorer** (`apps/explorer/`)
2. **Run Stress Tests** (`scripts/devnet_stress_test.py`)
3. **Trigger Slash Tests** (`scripts/trigger_slash_test.py`)
4. **Document Results** in `docs/reports/`

See `docs/plans/q4-testnet-launch-plan-v0.1.md` for Testnet prep.

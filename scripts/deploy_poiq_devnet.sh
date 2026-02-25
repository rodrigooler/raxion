#!/bin/bash
set -euo pipefail

PROGRAM_DIR="programs/raxion-poiq"

if ! command -v anchor >/dev/null 2>&1; then
  echo "anchor CLI not found. Install first: cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked"
  exit 1
fi

if ! command -v solana >/dev/null 2>&1; then
  echo "solana CLI not found. Install Solana/Agave CLI first."
  exit 1
fi

echo "[1/4] Solana config"
solana config get

echo "[2/4] Anchor build"
anchor build

# Anchor may emit artifacts under program-local target dir on some toolchain combos.
# Normalize into workspace target/deploy so `anchor deploy` can always find them.
if [ ! -f "target/deploy/raxion_poiq.so" ] && [ -f "$PROGRAM_DIR/target/deploy/raxion_poiq.so" ]; then
  mkdir -p target/deploy
  cp "$PROGRAM_DIR/target/deploy/raxion_poiq.so" "target/deploy/raxion_poiq.so"
fi
if [ ! -f "target/deploy/raxion_poiq-keypair.json" ] && [ -f "$PROGRAM_DIR/target/deploy/raxion_poiq-keypair.json" ]; then
  mkdir -p target/deploy
  cp "$PROGRAM_DIR/target/deploy/raxion_poiq-keypair.json" "target/deploy/raxion_poiq-keypair.json"
fi

echo "[3/4] Program tests"
cargo test --manifest-path "$PROGRAM_DIR/Cargo.toml"

echo "[4/4] Anchor deploy (devnet)"
anchor deploy

echo "Done. Update explorer env: NEXT_PUBLIC_POIQ_PROGRAM_ID=<deployed_program_id>"

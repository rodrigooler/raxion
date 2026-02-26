#!/bin/bash
set -euo pipefail

PROGRAM_DIR="programs/raxion-poiq"
CARGO_HOME="${CARGO_HOME:-$(pwd)/.cargo-home}"

if ! command -v anchor >/dev/null 2>&1; then
  echo "anchor CLI not found. Install first: cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked"
  exit 1
fi

if ! command -v solana >/dev/null 2>&1; then
  echo "solana CLI not found. Install Solana/Agave CLI first."
  exit 1
fi

echo "[1/5] Solana config"
solana config get
echo "Using CARGO_HOME=$CARGO_HOME"

echo "[2/5] Fetch crates + apply toolchain compatibility patches"
cargo fetch --manifest-path "$PROGRAM_DIR/Cargo.toml"
CARGO_REGISTRIES_CRATES_IO_PROTOCOL=git cargo fetch --manifest-path "$PROGRAM_DIR/Cargo.toml"
./scripts/apply_rust_toolchain_patches.sh

echo "[3/5] Anchor build"
# Some SBF toolchains download extra registry indexes on first build.
# Retry once after patching again so first-run environments stay deterministic.
anchor build || (./scripts/apply_rust_toolchain_patches.sh && anchor build)

# Anchor may emit artifacts under program-local target dir on some toolchain combos.
# Normalize into workspace target/deploy so `anchor deploy` can always find them.
if [[ ! -f "target/deploy/raxion_poiq.so" && -f "$PROGRAM_DIR/target/deploy/raxion_poiq.so" ]]; then
  mkdir -p target/deploy
  cp "$PROGRAM_DIR/target/deploy/raxion_poiq.so" "target/deploy/raxion_poiq.so"
fi
if [[ ! -f "target/deploy/raxion_poiq-keypair.json" && -f "$PROGRAM_DIR/target/deploy/raxion_poiq-keypair.json" ]]; then
  mkdir -p target/deploy
  cp "$PROGRAM_DIR/target/deploy/raxion_poiq-keypair.json" "target/deploy/raxion_poiq-keypair.json"
fi

echo "[4/5] Program tests"
cargo test --manifest-path "$PROGRAM_DIR/Cargo.toml"

echo "[5/5] Anchor deploy (devnet)"
deploy_output="$(anchor deploy 2>&1)"
echo "$deploy_output"

deployed_program_id="$(
  printf '%s\n' "$deploy_output" \
    | sed -n 's/.*Program Id:[[:space:]]*\([1-9A-HJ-NP-Za-km-z]\{32,44\}\).*/\1/p' \
    | tail -n1
)"

if [[ -z "$deployed_program_id" && -f "target/deploy/raxion_poiq-keypair.json" ]]; then
  deployed_program_id="$(solana address -k target/deploy/raxion_poiq-keypair.json)"
fi

if [[ -n "$deployed_program_id" ]]; then
  echo "Done. Update explorer env: NEXT_PUBLIC_POIQ_PROGRAM_ID=$deployed_program_id"
else
  echo "Done. Could not auto-detect deployed program id. Check anchor deploy output above."
fi

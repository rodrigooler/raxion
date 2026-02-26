#!/bin/bash
set -euo pipefail

IMAGE_TAG="raxion/anchor-devnet:0.1"
SOLANA_DIR="$HOME/.config/solana"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"
CONTAINER_PATH="/usr/local/cargo/bin:/root/.local/share/solana/install/active_release/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found"
  exit 1
fi

mkdir -p "$SOLANA_DIR"

docker build --platform "$DOCKER_PLATFORM" -f ops/docker/anchor-devnet/Dockerfile -t "$IMAGE_TAG" .

TTY_ARGS=""
if [ -t 0 ] && [ -t 1 ]; then
  TTY_ARGS="-it"
fi

# Generate keypair only if missing.
if [ ! -f "$SOLANA_DIR/id.json" ]; then
  docker run --rm $TTY_ARGS \
    --platform "$DOCKER_PLATFORM" \
    -v "$SOLANA_DIR":/root/.config/solana \
    -e PATH="$CONTAINER_PATH" \
    "$IMAGE_TAG" \
    bash -c "solana-keygen new --no-bip39-passphrase -o /root/.config/solana/id.json --force"
  chmod 600 "$SOLANA_DIR/id.json"
fi

# If keypair exists but is malformed, stop to avoid destructive overwrite.
if ! docker run --rm $TTY_ARGS \
  --platform "$DOCKER_PLATFORM" \
  -v "$SOLANA_DIR":/root/.config/solana \
  -e PATH="$CONTAINER_PATH" \
  "$IMAGE_TAG" \
  bash -c "solana address --keypair /root/.config/solana/id.json >/dev/null 2>&1"; then
  echo "Existing keypair at $SOLANA_DIR/id.json appears invalid."
  echo "Refusing to overwrite automatically. Fix/recover it manually and re-run."
  exit 1
fi

# Configure devnet endpoint in a local config file.
docker run --rm $TTY_ARGS \
  --platform "$DOCKER_PLATFORM" \
  -v "$SOLANA_DIR":/root/.config/solana \
  -e PATH="$CONTAINER_PATH" \
  "$IMAGE_TAG" \
  bash -c "solana config set --url https://api.devnet.solana.com --keypair /root/.config/solana/id.json"

# Attempt devnet airdrop so deploy can proceed.
docker run --rm $TTY_ARGS \
  --platform "$DOCKER_PLATFORM" \
  -v "$SOLANA_DIR":/root/.config/solana \
  -e PATH="$CONTAINER_PATH" \
  "$IMAGE_TAG" \
  bash -c "solana airdrop 2 --keypair /root/.config/solana/id.json || true; solana balance --keypair /root/.config/solana/id.json"

echo "Bootstrap complete: $SOLANA_DIR/id.json"

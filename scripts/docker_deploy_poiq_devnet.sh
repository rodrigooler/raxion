#!/bin/bash
set -euo pipefail

IMAGE_TAG="raxion/anchor-devnet:0.1"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found"
  exit 1
fi

if [ ! -d "$HOME/.config/solana" ]; then
  echo "missing $HOME/.config/solana"
  exit 1
fi

docker build -f docker/anchor-devnet/Dockerfile -t "$IMAGE_TAG" .

docker run --rm -it \
  -v "$(pwd)":/work \
  -v "$HOME/.config/solana":/root/.config/solana \
  -e ANCHOR_WALLET=/root/.config/solana/id.json \
  -w /work \
  "$IMAGE_TAG" \
  bash -lc "solana --version && anchor --version && ./scripts/deploy_poiq_devnet.sh"

#!/bin/bash
set -euo pipefail

IMAGE_TAG="raxion/anchor-devnet:0.1"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found"
  exit 1
fi

docker build -f docker/anchor-devnet/Dockerfile -t "$IMAGE_TAG" .

docker run --rm -it \
  -v "$(pwd)":/work \
  -v "$HOME/.config/solana":/root/.config/solana \
  -w /work \
  "$IMAGE_TAG" bash

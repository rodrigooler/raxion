#!/bin/bash
set -euo pipefail

IMAGE_TAG="raxion/anchor-devnet:0.1"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"
CONTAINER_PATH="/usr/local/cargo/bin:/root/.local/share/solana/install/active_release/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found"
  exit 1
fi

docker build --platform "$DOCKER_PLATFORM" -f ops/docker/anchor-devnet/Dockerfile -t "$IMAGE_TAG" .

TTY_ARGS=""
if [ -t 0 ] && [ -t 1 ]; then
  TTY_ARGS="-it"
fi

if [ "$#" -gt 0 ]; then
  docker run --rm $TTY_ARGS \
    --platform "$DOCKER_PLATFORM" \
    -v "$(pwd)":/work \
    -v "$HOME/.config/solana":/home/raxion/.config/solana \
    -e PATH="$CONTAINER_PATH" \
    -e HOME=/home/raxion \
    -e CARGO_HOME=/work/.cargo-home \
    -w /work \
    "$IMAGE_TAG" bash -c "$*"
else
  docker run --rm $TTY_ARGS \
    --platform "$DOCKER_PLATFORM" \
    -v "$(pwd)":/work \
    -v "$HOME/.config/solana":/home/raxion/.config/solana \
    -e PATH="$CONTAINER_PATH" \
    -e HOME=/home/raxion \
    -e CARGO_HOME=/work/.cargo-home \
    -w /work \
    "$IMAGE_TAG" bash
fi

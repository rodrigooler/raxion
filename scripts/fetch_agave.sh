#!/bin/bash
set -euo pipefail

# Fetch Agave source on demand, pinned to the same upstream commit used during Q2 setup.
# This avoids vendoring the full upstream tree in this repository.

AGAVE_REPO_URL="${AGAVE_REPO_URL:-https://github.com/anza-xyz/agave.git}"
AGAVE_REF="${AGAVE_REF:-2694497991c6f789c1775d81f5968f11ee32ac4b}"
AGAVE_DIR="${AGAVE_DIR:-runtime/agave}"
PATCH_DIR="${PATCH_DIR:-patches/agave}"

if ! command -v git >/dev/null 2>&1; then
  echo "git not found"
  exit 1
fi

mkdir -p "$(dirname "$AGAVE_DIR")"

if [[ ! -d "$AGAVE_DIR/.git" ]]; then
  echo "[agave] cloning $AGAVE_REPO_URL into $AGAVE_DIR"
  git clone "$AGAVE_REPO_URL" "$AGAVE_DIR"
fi

echo "[agave] fetching refs"
git -C "$AGAVE_DIR" fetch --tags --prune origin

echo "[agave] checking out $AGAVE_REF"
git -C "$AGAVE_DIR" checkout "$AGAVE_REF"

if [[ -d "$PATCH_DIR" ]]; then
  shopt -s nullglob
  patch_files=("$PATCH_DIR"/*.patch)
  if [[ "${#patch_files[@]}" -gt 0 ]]; then
    echo "[agave] applying local patches from $PATCH_DIR"
    for patch_file in "${patch_files[@]}"; do
      echo "  - $(basename "$patch_file")"
      git -C "$AGAVE_DIR" apply "$PWD/$patch_file"
    done
  fi
fi

echo "[agave] ready at $AGAVE_DIR"

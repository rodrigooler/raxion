#!/bin/bash
set -euo pipefail

# Patch crates in local cargo registry for older SBF cargo toolchains.
# This keeps the repo slim (no vendored third_party trees) while preserving reproducible builds.

if [ -n "${CARGO_HOME:-}" ]; then
  REGISTRY_SRC="$CARGO_HOME/registry/src"
else
  REGISTRY_SRC="$HOME/.cargo/registry/src"
fi

if [ ! -d "$REGISTRY_SRC" ]; then
  echo "[patch] cargo registry not found at $REGISTRY_SRC (nothing to patch yet)"
  exit 0
fi

find_all() {
  find "$REGISTRY_SRC" -type f -path "$1" 2>/dev/null
}

patch_constant_time_eq() {
  local files
  files="$(find_all '*/constant_time_eq-0.4.2/Cargo.toml')"
  if [ -z "$files" ]; then
    return
  fi
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    sed -i.bak 's/^edition = "2024"$/edition = "2021"/' "$file"
    sed -i.bak 's/^rust-version = "1\.85\.0"$/rust-version = "1.79.0"/' "$file"
    rm -f "${file}.bak"
    echo "[patch] constant_time_eq patched: $file"
  done <<< "$files"
}

patch_blake3() {
  local files
  files="$(find_all '*/blake3-1.8.3/Cargo.toml')"
  if [ -z "$files" ]; then
    return
  fi
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    sed -i.bak 's/^edition = "2024"$/edition = "2021"/' "$file"
    rm -f "${file}.bak"
    echo "[patch] blake3 patched: $file"
  done <<< "$files"
}

patch_anchor_syn() {
  local files
  files="$(find_all '*/anchor-syn-0.30.1/src/idl/defined.rs')"
  if [ -z "$files" ]; then
    return
  fi
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    sed -i.bak 's/proc_macro2::Span::call_site().source_file().path()/std::path::PathBuf::from(".")/' "$file"
    rm -f "${file}.bak"
    echo "[patch] anchor-syn patched: $file"
  done <<< "$files"
}

patch_constant_time_eq
patch_blake3
patch_anchor_syn

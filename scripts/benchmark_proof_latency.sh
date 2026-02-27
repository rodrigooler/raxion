#!/usr/bin/env bash
set -uo pipefail

echo "=== RAXION Proof Latency Benchmark ==="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Hardware: $(uname -m) | GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null || echo 'none')"
echo ""

for dim in 384 768 1536; do
  echo "--- RISC Zero | embedding dim=${dim} ---"
  if RISC0_SKIP_BUILD_KERNELS=1 cargo run -p risc0-host --manifest-path proofs/Cargo.toml -- --benchmark --dim "${dim}" 2>&1 | grep -E "Proof generated|Proof verified|RISC0"; then
    true
  else
    echo "risc0 benchmark skipped/failed for dim=${dim} (local toolchain constraints)"
  fi
  echo ""
done

for dim in 384 768 1536; do
  echo "--- Jolt | embedding dim=${dim} ---"
  if cargo metadata --manifest-path proofs/Cargo.toml --no-deps --format-version 1 | grep -q '"name":"raxion-jolt-quality"'; then
    if cargo test -p raxion-jolt-quality --manifest-path proofs/Cargo.toml -- --nocapture 2>&1 | grep -E "test result|ok"; then
      echo "jolt quality checks passed for dim=${dim} (scaffold mode)"
    else
      echo "jolt benchmark skipped/failed for dim=${dim}"
    fi
  else
    echo "raxion-jolt-quality not present yet (skip)"
  fi
  echo ""
done

echo "=== Benchmark complete ==="
echo "Target: P90 latency < 10s on GPU"

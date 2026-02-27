#!/usr/bin/env bash
set -euo pipefail

echo "=== RAXION Proof Latency Benchmark ==="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Hardware: $(uname -m) | GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null || echo 'none')"
echo ""

for dim in 384 768 1536; do
  echo "--- RISC Zero | embedding dim=${dim} ---"
  time cargo run -p risc0-host --manifest-path proofs/Cargo.toml -- --benchmark --dim "${dim}" 2>&1 | grep -E "Proof generated|Proof verified|RISC0"
  echo ""
done

for dim in 384 768 1536; do
  echo "--- Jolt | embedding dim=${dim} ---"
  if cargo metadata --manifest-path proofs/Cargo.toml --no-deps --format-version 1 | grep -q '"name":"raxion-jolt-quality"'; then
    time cargo run -p raxion-jolt-quality --manifest-path proofs/Cargo.toml -- --benchmark --dim "${dim}" 2>&1 | grep -E "Proof|time|JOLT"
  else
    echo "raxion-jolt-quality not present yet (skip)"
  fi
  echo ""
done

echo "=== Benchmark complete ==="
echo "Target: P90 latency < 10s on GPU"

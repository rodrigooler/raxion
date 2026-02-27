#!/bin/bash
set -euo pipefail

CLUSTER="${1:-devnet}"
PROGRAM_ID="${RAXION_POIQ_PROGRAM_ID:-5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT}"

if [[ "$CLUSTER" != "devnet" && "$CLUSTER" != "testnet" && "$CLUSTER" != "localnet" ]]; then
  echo "usage: $0 [devnet|testnet|localnet]"
  exit 1
fi

export RAXION_CLUSTER="$CLUSTER"
export RAXION_POIQ_PROGRAM_ID="$PROGRAM_ID"
export RAXION_LOADGEN_AGENTS="${RAXION_LOADGEN_AGENTS:-10}"
export RAXION_LOADGEN_QUERIES="${RAXION_LOADGEN_QUERIES:-1000}"
export RAXION_LOADGEN_STAKE="${RAXION_LOADGEN_STAKE:-1000000}"
export RAXION_LOADGEN_LOW_SCORE_EVERY="${RAXION_LOADGEN_LOW_SCORE_EVERY:-50}"
export RAXION_LOADGEN_CHALLENGE_FAIL_EVERY="${RAXION_LOADGEN_CHALLENGE_FAIL_EVERY:-5}"
export RAXION_LOADGEN_REPORT_OUT="${RAXION_LOADGEN_REPORT_OUT:-docs/reports/network-loadgen-report-${CLUSTER}.json}"

echo "[loadgen] cluster=$RAXION_CLUSTER program=$RAXION_POIQ_PROGRAM_ID agents=$RAXION_LOADGEN_AGENTS queries=$RAXION_LOADGEN_QUERIES"
cargo run --manifest-path programs/raxion-poiq/Cargo.toml --example network_loadgen
echo "[loadgen] report=$RAXION_LOADGEN_REPORT_OUT"

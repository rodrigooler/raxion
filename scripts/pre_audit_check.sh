#!/usr/bin/env bash
set -euo pipefail

echo "=== RAXION Pre-Audit Checks ==="
PASS=0
FAIL=0

check() {
  local desc="$1"
  local cmd="$2"
  if eval "$cmd" > /tmp/raxion_preaudit.log 2>&1; then
    echo "  OK  $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL $desc"
    sed -n '1,80p' /tmp/raxion_preaudit.log
    FAIL=$((FAIL + 1))
  fi
}

if command -v anchor >/dev/null 2>&1; then
  check "anchor build" "anchor build"
else
  check "program builds (cargo fallback)" "cargo test --manifest-path programs/raxion-poiq/Cargo.toml"
fi

check "No unwrap() in programs/*/src" \
  "! rg -n \"unwrap\\(\\)\" programs/*/src --glob '*.rs'"

check "PoIQ tests pass" \
  "cargo test --manifest-path programs/raxion-poiq/Cargo.toml"

check "Runtime cognitive tests pass" \
  "cargo test --manifest-path runtime/cognitive/Cargo.toml"

check "No TODO/FIXME/HACK in programs/*/src" \
  "! rg -n \"TODO|FIXME|HACK\" programs/*/src --glob '*.rs'"

check "rustdoc on raxion-poiq builds" \
  "cargo doc --manifest-path programs/raxion-poiq/Cargo.toml --no-deps"

echo
echo "Pre-audit: $PASS passed, $FAIL failed"
if [[ "$FAIL" -eq 0 ]]; then
  echo "OK Ready for audit submission"
else
  echo "FAIL Fix failures before submitting"
fi
exit "$FAIL"

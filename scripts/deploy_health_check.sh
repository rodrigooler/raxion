#!/bin/bash
# RAXION Devnet Health Check
# Verifies all components are deployed and responsive

set -euo pipefail

RPC_URL="${SOLANA_RPC_URL:-https://api.devnet.solana.com}"
PROGRAM_ID="${POIQ_PROGRAM_ID:-5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT}"
EXPLORER_URL="https://explorer.solana.com"
DIVIDER="========================================"

PASS=0
FAIL=0

check() {
    local name="$1"
    local result="$2"
    if [[ "$result" == OK ]] || [[ "$result" == OK\ * ]]; then
        echo "[PASS] $name: $result"
        PASS=$((PASS + 1))
    else
        echo "[FAIL] $name: $result" >&2
        FAIL=$((FAIL + 1))
    fi
    return 0
}

rpc_call() {
    local method="$1"
    local params="$2"
    curl -s -X POST "$RPC_URL" \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$method\",\"params\":$params}"
    return 0
}

echo "$DIVIDER"
echo "  RAXION Devnet Health Check"
echo "$DIVIDER"
echo ""
echo "RPC: $RPC_URL"
echo "Program: $PROGRAM_ID"
echo ""

# 1. Solana RPC Health
echo "[1] Solana Network"
HEALTH=$(rpc_call "getHealth" "[]")
HEALTH_RESULT=$(echo "$HEALTH" | jq -r '.result // .error.message // "ERROR"' 2>&1 || echo "ERROR")
if [[ "$HEALTH_RESULT" == "ok" ]]; then
    check "Solana RPC" "OK"
else
    check "Solana RPC" "$HEALTH_RESULT"
fi

# 2. Slot
echo ""
echo "[2] Network State"
SLOT=$(rpc_call "getSlot" "[]")
SLOT_NUM=$(echo "$SLOT" | jq -r '.result // "ERROR"' 2>&1 || echo "ERROR")
if [[ "$SLOT_NUM" != "ERROR" ]]; then
    check "Current Slot" "OK (slot $SLOT_NUM)"
else
    check "Current Slot" "ERROR"
fi

# 3. Program Account
echo ""
echo "[3] RAXION Program"
PROGRAM_INFO=$(rpc_call "getAccountInfo" "[\"$PROGRAM_ID\", {\"encoding\":\"base64\"}]")
PROGRAM_EXISTS=$(echo "$PROGRAM_INFO" | jq -r '.result.value != null' 2>/dev/null || echo "false")
if [[ "$PROGRAM_EXISTS" == "true" ]]; then
    LAMPORTS=$(echo "$PROGRAM_INFO" | jq -r '.result.value.lamports // 0' 2>/dev/null || echo "0")
    OWNER=$(echo "$PROGRAM_INFO" | jq -r '.result.value.owner // "unknown"' 2>/dev/null || echo "unknown")
    check "Program Deployed" "OK"
    echo "     Owner: $OWNER"
    echo "     Link: ${EXPLORER_URL}/account/${PROGRAM_ID}?cluster=devnet"
else
    check "Program Deployed" "NOT FOUND"
    echo "     Deploy with: make deploy"
fi

# 4. Program Size
if [[ "$PROGRAM_EXISTS" == "true" ]]; then
    DATA_LEN=$(echo "$PROGRAM_INFO" | jq -r '.result.value.data[0] | length // 0' 2>/dev/null || echo "0")
    echo "     Size: $((DATA_LEN / 2)) bytes"
fi

# 5. Recent Transactions
echo ""
echo "[4] Recent Activity"
SIGNATURES=$(rpc_call "getSignaturesForAddress" "[\"$PROGRAM_ID\", {\"limit\": 5}]")
TX_COUNT=$(echo "$SIGNATURES" | jq -r '[.result] | length' 2>/dev/null || echo "0")
if [[ "$TX_COUNT" -gt 0 ]]; then
    check "Recent Transactions" "OK ($TX_COUNT txs)"
    echo "$SIGNATURES" | jq -r '.result[:3][] | "     - \(.signature[0..20])... slot:\(.slot)"' 2>/dev/null || true
else
    check "Recent Transactions" "NONE (first deploy?)"
fi

# 6. Wallet Status (optional)
echo ""
echo "[5] Wallet Status"
if command -v solana-keygen >/dev/null 2>&1; then
    if [[ -f ~/.config/solana/id.json ]]; then
        WALLET_PUBKEY=$(solana-keygen pubkey ~/.config/solana/id.json 2>/dev/null || echo "")
        if [[ -n "$WALLET_PUBKEY" ]]; then
            echo "     Wallet: $WALLET_PUBKEY"
            if command -v solana >/dev/null 2>&1; then
                BALANCE=$(solana balance --url devnet 2>&1 | awk '{print $1}' || echo "ERROR")
                echo "     Balance: $BALANCE SOL"
            fi
        else
            echo "     [WARN] Cannot read wallet" >&2
        fi
    else
        echo "     [WARN] No wallet at ~/.config/solana/id.json" >&2
        echo "     Deploy will create wallet inside Docker"
    fi
else
    echo "     [INFO] Solana CLI not installed locally" >&2
    echo "     Wallet management happens inside Docker"
fi

# Summary
echo ""
echo "$DIVIDER"
echo "  Summary"
echo "$DIVIDER"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [[ $FAIL -eq 0 ]]; then
    echo "All checks passed!"
    echo ""
    echo "Next steps:"
    echo "  1. make deploy        - Deploy to devnet (if program not deployed)"
    echo "  2. make test          - Run program tests"
    echo "  3. cd apps/explorer && npm run dev - Start explorer"
    exit 0
else
    echo "Some checks failed."
    exit 1
fi

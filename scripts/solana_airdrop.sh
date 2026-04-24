#!/bin/bash
# Solana Devnet Airdrop Helper
# Usage:
#   ./scripts/solana_airdrop.sh 2          # Get 2 SOL
#   ./scripts/solana_airdrop.sh --check    # Check balance

set -euo pipefail

AMOUNT="${1:-}"
CHECK_ONLY=false

if [[ "$#" -eq 1 && "$1" == "--check" ]]; then
    CHECK_ONLY=true
fi

SOLANA_CONFIG="${HOME}/.config/solana/id.json"
WALLET_PUBKEY="$(solana-keygen pubkey "${SOLANA_CONFIG}" 2>/dev/null || echo "")"

if [[ -z "$WALLET_PUBKEY" ]]; then
    echo "ERROR: Cannot read wallet from ${SOLANA_CONFIG}"
    echo "Create wallet with: solana-keygen new"
    exit 1
fi

if [[ "$CHECK_ONLY" == "true" ]]; then
    BALANCE=$(solana balance --url devnet 2>/dev/null | awk '{print $1}' || echo "ERROR")
    echo "Wallet: ${WALLET_PUBKEY}"
    echo "Balance: ${BALANCE} SOL"
    exit 0
fi

if [[ -z "$AMOUNT" ]]; then
    echo "Usage: $0 <amount>   (e.g., $0 2)"
    echo "       $0 --check     (check balance)"
    exit 1
fi

echo "=== Solana Devnet Airdrop ==="
echo "Wallet: ${WALLET_PUBKEY}"
echo "Requesting: ${AMOUNT} SOL"
echo ""

# Devnet airdrop endpoint
RESPONSE=$(curl -s -X POST "https://api.devnet.solana.com" \
    -H "Content-Type: application/json" \
    -d "{
        \"jsonrpc\": \"2.0\",
        \"id\": 1,
        \"method\": \"requestAirdrop\",
        \"params\": [
            \"${WALLET_PUBKEY}\",
            $((AMOUNT * 1000000000))
        ]
    }")

ERROR=$(echo "$RESPONSE" | jq -r '.error.message // empty')
if [[ -n "$ERROR" ]]; then
    echo "ERROR: $ERROR"
    exit 1
fi

TX_HASH=$(echo "$RESPONSE" | jq -r '.result // empty')
if [[ -z "$TX_HASH" ]]; then
    echo "ERROR: No transaction hash returned"
    exit 1
fi

echo "Transaction: https://explorer.solana.com/tx/${TX_HASH}?cluster=devnet"
echo "Waiting for confirmation..."

# Wait for confirmation
if solana confirm --url devnet "$TX_HASH" 2>/dev/null; then
    NEW_BALANCE=$(solana balance --url devnet | awk '{print $1}')
    echo ""
    echo "Success! New balance: ${NEW_BALANCE} SOL"
else
    echo ""
    echo "Transaction submitted. Check status at:"
    echo "https://explorer.solana.com/tx/${TX_HASH}?cluster=devnet"
fi

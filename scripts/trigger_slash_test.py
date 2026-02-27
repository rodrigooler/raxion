#!/usr/bin/env python3
"""Trigger a documented SlashEvent on Devnet.

This attempts to call a debug endpoint used for operational validation.
"""

from __future__ import annotations

import argparse
import httpx

DEFAULT_BASE_URL = "https://devnet.raxion.network"


def trigger_immediate_slash(base_url: str) -> None:
    print("[SlashTest] Submitting deliberately incoherent inference pair...")
    resp = httpx.post(
        f"{base_url}/api/debug/trigger_slash",
        json={
            "output_t": "The mitochondria is the powerhouse of the cell.",
            "output_s": "Solana achieves 65,000 TPS via parallel transaction processing.",
            "agent": "slash_test_agent_do_not_stake",
        },
        timeout=60.0,
    )
    resp.raise_for_status()
    data = resp.json()

    score = float(data["coherence_score"])
    slash_tx = data.get("slash_tx")
    print(f"CoherenceScore: {score:.3f}")
    print(f"Category:       {data.get('category', 'UNKNOWN')}")
    print(f"SlashEvent TX:  {slash_tx or 'none'}")

    assert score < 0.30, "Expected CS < 0.30 for slash trigger"
    assert slash_tx, "Expected SlashEvent transaction"
    print("OK Slash triggered and documented on-chain")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    args = parser.parse_args()
    trigger_immediate_slash(args.base_url)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

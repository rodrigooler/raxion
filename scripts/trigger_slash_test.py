#!/usr/bin/env python3
"""Trigger a documented SlashEvent on Devnet.

This attempts to call a debug endpoint used for operational validation.
"""

from __future__ import annotations

import argparse
import json
from urllib import error as urlerror
from urllib import request as urlrequest

DEFAULT_BASE_URL = "https://devnet.raxion.network"


def trigger_immediate_slash(base_url: str) -> None:
    print("[SlashTest] Submitting deliberately incoherent inference pair...")
    payload = json.dumps(
        {
            "output_t": "The mitochondria is the powerhouse of the cell.",
            "output_s": "Solana achieves 65,000 TPS via parallel transaction processing.",
            "agent": "slash_test_agent_do_not_stake",
        }
    ).encode("utf-8")
    req = urlrequest.Request(
        f"{base_url}/api/debug/trigger_slash",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=60.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urlerror.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"http error {exc.code}: {body}") from exc
    except urlerror.URLError as exc:
        raise RuntimeError(f"url error: {exc.reason}") from exc

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

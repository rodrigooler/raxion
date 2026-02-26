#!/usr/bin/env python3
"""Cross-validate Rust and Python coherence fixtures.

This script validates deterministic fixture parity for CoherenceScore components.
It is intentionally offline-safe and does not depend on model downloads.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


ALPHA = 0.4
BETA = 0.6
THRESHOLD_REJECT = 0.30
THRESHOLD_STANDARD = 0.60
THRESHOLD_HIGH = 0.85


def geometric_mean(values: list[float]) -> float:
    if any(v <= 0.0 for v in values):
        return 0.0
    return math.exp(sum(math.log(v) for v in values) / len(values))


def categorize(score: float) -> str:
    if score < THRESHOLD_REJECT:
        return "REJECTED"
    if score < THRESHOLD_STANDARD:
        return "LOW_CONFIDENCE"
    if score < THRESHOLD_HIGH:
        return "STANDARD"
    return "HIGH_COHERENCE"


def main() -> int:
    fixture_path = Path("proofs/risc0-types/tests/fixtures/coherence_python_fixtures.json")
    if not fixture_path.exists():
        print(f"FAIL: fixture file not found: {fixture_path}")
        return 1

    fixtures = json.loads(fixture_path.read_text())
    if not fixtures:
        print("FAIL: fixture list is empty")
        return 1

    failures: list[str] = []
    eps = 1e-9

    for case in fixtures:
        cs = geometric_mean([case["sim_ts"], case["sim_tn"], case["sim_sn"]])
        score = ALPHA * cs + BETA * case["cc_approximate"]

        if abs(cs - case["cs_semantic"]) > eps:
            failures.append(
                f"{case['name']}: cs_semantic mismatch (py={cs:.12f} fixture={case['cs_semantic']:.12f})"
            )
        if abs(score - case["score"]) > eps:
            failures.append(
                f"{case['name']}: score mismatch (py={score:.12f} fixture={case['score']:.12f})"
            )

        category = categorize(score)
        if category != case["category"]:
            failures.append(
                f"{case['name']}: category mismatch (py={category} fixture={case['category']})"
            )

    if failures:
        print("FAIL")
        for item in failures:
            print(f"- {item}")
        return 1

    print("PASS: coherence fixture cross-validation is consistent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

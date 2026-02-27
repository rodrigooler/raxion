#!/usr/bin/env python3
"""
RAXION Devnet Stress Test.

Runs query load against the live endpoint and validates the Q2/Q3 operational
criteria with persisted benchmark evidence.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import request as urlrequest

DEFAULT_BASE_URL = "https://devnet.raxion.network"
RESULTS_DIR = Path("poc/benchmarks/devnet_results")
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class QueryResult:
    query_id: int
    query: str
    coherence_score: float
    category: str
    is_final: bool
    is_challenged: bool
    latency_ms: float
    tx_sig: str
    error: str | None = None


BASE_QUERIES = [
    "Explain the CAP theorem and its implications for distributed database design.",
    "What is the difference between a SNARK and a STARK proof system?",
    "Prove by induction that the sum of first n natural numbers is n(n+1)/2.",
    "What is the time complexity of Dijkstra's algorithm with a binary heap?",
    "Explain zero-knowledge proofs and give a concrete example.",
    "What is a reentrancy attack and how do you prevent it in Solidity?",
    "Describe the Byzantine Generals Problem and its relevance to blockchain.",
    "What is the Halting Problem and why is it undecidable?",
    "Explain the difference between proof-of-work and proof-of-stake.",
    "What is a Merkle tree and how is it used in blockchains?",
]


def build_queries(n: int) -> list[str]:
    repeats = (n // len(BASE_QUERIES)) + 1
    return (BASE_QUERIES * repeats)[:n]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    idx = min(len(values) - 1, int(len(values) * p))
    return sorted(values)[idx]


async def submit_query(
    base_url: str, query_id: int, query: str
) -> QueryResult:
    start = time.perf_counter()
    try:
        payload = json.dumps({"query": query, "agent": "stress_test_agent"}).encode("utf-8")
        req = urlrequest.Request(
            f"{base_url}/api/inference",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        data = await asyncio.to_thread(_urlopen_json, req, 90.0)
        return QueryResult(
            query_id=query_id,
            query=query[:80],
            coherence_score=float(data.get("coherence_score", 0.0)),
            category=str(data.get("category", "UNKNOWN")),
            is_final=bool(data.get("is_final", False)),
            is_challenged=bool(data.get("is_challenged", False)),
            latency_ms=(time.perf_counter() - start) * 1000.0,
            tx_sig=str(data.get("tx_sig", "")),
            error=None,
        )
    except Exception as exc:  # pragma: no cover - network dependent
        return QueryResult(
            query_id=query_id,
            query=query[:80],
            coherence_score=0.0,
            category="ERROR",
            is_final=False,
            is_challenged=False,
            latency_ms=(time.perf_counter() - start) * 1000.0,
            tx_sig="",
            error=str(exc),
        )


async def run_stress_test(base_url: str, n: int = 1000, concurrency: int = 5) -> dict[str, Any]:
    queries = build_queries(n)
    results: list[QueryResult] = []
    errors = 0

    print(f"[Stress Test] Starting {n} queries at concurrency={concurrency}")
    print(f"[Stress Test] Target: {base_url}")
    print(f"[Stress Test] Started: {now_iso()}\n")

    semaphore = asyncio.Semaphore(concurrency)

    async def bounded(i: int, q: str) -> QueryResult:
        async with semaphore:
            return await submit_query(base_url, i, q)

    tasks = [bounded(i, q) for i, q in enumerate(queries)]
    for coro in asyncio.as_completed(tasks):
        result = await coro
        results.append(result)
        if result.error:
            errors += 1
        if len(results) % 100 == 0:
            done = len(results)
            ok = done - errors
            valid_scores = [r.coherence_score for r in results if not r.error]
            avg_score = statistics.mean(valid_scores) if valid_scores else 0.0
            print(f"  [{done}/{n}] OK={ok} Errors={errors} AvgCS={avg_score:.3f}")

    scores = [r.coherence_score for r in results if not r.error]
    challenged = sum(1 for r in results if r.is_challenged)
    latencies = [r.latency_ms for r in results if not r.error]

    avg_score = statistics.mean(scores) if scores else 0.0
    stats = {
        "base_url": base_url,
        "total_queries": n,
        "successful": len(scores),
        "errors": errors,
        "protocol_failure_rate": (errors / n) if n else 1.0,
        "avg_coherence_score": avg_score,
        "median_coherence_score": statistics.median(scores) if scores else 0.0,
        "pct_final": (sum(1 for r in results if r.is_final) / n * 100.0) if n else 0.0,
        "challenged_count": challenged,
        "observed_challenge_rate": (challenged / n) if n else 0.0,
        "avg_latency_ms": statistics.mean(latencies) if latencies else 0.0,
        "p90_latency_ms": percentile(latencies, 0.90),
        "p99_latency_ms": percentile(latencies, 0.99),
        "q2_c1_no_protocol_failure": (errors / n) < 0.01 if n else False,
        "q2_c2_avg_cs_above_0_65": avg_score >= 0.65,
        "q2_c3_challenge_rate_1_5pct": 0.010 <= (challenged / n) <= 0.025 if n else False,
        "timestamp": now_iso(),
    }

    out_file = RESULTS_DIR / f"stress_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with out_file.open("w", encoding="utf-8") as fh:
        json.dump({"stats": stats, "results": [asdict(r) for r in results]}, fh, indent=2)

    print(f"\n{'='*60}")
    print("STRESS TEST RESULTS")
    print(f"{'='*60}")
    print(f"Queries processed:     {stats['successful']}/{n}")
    print(f"Protocol failure rate: {stats['protocol_failure_rate']:.3%}")
    print(f"Avg CoherenceScore:    {stats['avg_coherence_score']:.3f}")
    print(f"Cognitive Finality:    {stats['pct_final']:.1f}%")
    print(f"Challenge rate:        {stats['observed_challenge_rate']:.3%}")
    print(f"P90 latency:           {stats['p90_latency_ms']:.0f}ms")
    print("\nQ2 Criteria:")
    print(f"  No protocol failure (<1%):  {'OK' if stats['q2_c1_no_protocol_failure'] else 'FAIL'}")
    print(f"  Avg CS >= 0.65:             {'OK' if stats['q2_c2_avg_cs_above_0_65'] else 'FAIL'}")
    print(f"  Challenge rate ~= 1.5%:     {'OK' if stats['q2_c3_challenge_rate_1_5pct'] else 'FAIL'}")
    print(f"\nResults saved: {out_file}")

    return stats


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=1000)
    parser.add_argument("--concurrency", type=int, default=5)
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    asyncio.run(run_stress_test(args.base_url, args.n, args.concurrency))
    return 0


def _urlopen_json(req: urlrequest.Request, timeout: float) -> dict[str, Any]:
    try:
        with urlrequest.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urlerror.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"http error {exc.code}: {detail}") from exc
    except urlerror.URLError as exc:
        raise RuntimeError(f"url error: {exc.reason}") from exc


if __name__ == "__main__":
    raise SystemExit(main())

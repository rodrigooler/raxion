"""
Load benchmark queries for PoC convergence validation.

Primary dataset: MMLU (Massive Multitask Language Understanding)
Selected domains: STEM, reasoning, logic - where convergence is most meaningful.

Fallback: Hardcoded sample queries if MMLU unavailable.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib


@dataclass
class BenchmarkQuery:
    query: str
    domain: str
    has_ground_truth: bool
    ground_truth: str | None = None


SAMPLE_QUERIES = [
    BenchmarkQuery(
        query="Explain why the Oracle Problem makes human-validated blockchain consensus fundamentally limited.",
        domain="blockchain_reasoning", has_ground_truth=False
    ),
    BenchmarkQuery(
        query="What is 2^10 + 2^8?",
        domain="math", has_ground_truth=True, ground_truth="1280"
    ),
    BenchmarkQuery(
        query="In Python, what does the `yield` keyword do?",
        domain="code", has_ground_truth=False
    ),
    BenchmarkQuery(
        query="What is the time complexity of quicksort in the average case?",
        domain="cs_theory", has_ground_truth=True, ground_truth="O(n log n)"
    ),
    BenchmarkQuery(
        query="Explain the CAP theorem and its implications for distributed systems.",
        domain="distributed_systems", has_ground_truth=False
    ),
    BenchmarkQuery(
        query="What is the difference between a SNARK and a STARK?",
        domain="cryptography", has_ground_truth=False
    ),
    BenchmarkQuery(
        query="If all men are mortal and Socrates is a man, is Socrates mortal?",
        domain="logic", has_ground_truth=True, ground_truth="Yes"
    ),
    BenchmarkQuery(
        query="What is zero-knowledge proof and why is it useful for blockchains?",
        domain="cryptography", has_ground_truth=False
    ),
    BenchmarkQuery(
        query="Describe the difference between proof-of-work and proof-of-stake consensus.",
        domain="blockchain_reasoning", has_ground_truth=False
    ),
    BenchmarkQuery(
        query="What causes validator cartel formation in delegated proof-of-stake networks?",
        domain="blockchain_reasoning", has_ground_truth=False
    ),
]


def load_sample_queries(n: int = 10, seed: int = 42) -> list[BenchmarkQuery]:
    """Return a shuffled sample of benchmark queries."""
    queries = SAMPLE_QUERIES.copy()
    return _deterministic_sample(queries, n=n, seed=seed)


def load_mmlu_queries(n: int = 100, seed: int = 42) -> list[BenchmarkQuery]:
    """
    Load MMLU queries from HuggingFace datasets.
    Falls back to sample queries if unavailable.
    """
    try:
        from datasets import load_dataset
        ds = load_dataset("cais/mmlu", "all", split="test", streaming=True)
        queries = []
        for item in ds:
            if len(queries) >= n * 3:
                break

            question = item.get("question")
            choices = item.get("choices", [])
            answer_idx = item.get("answer")
            if not isinstance(question, str) or len(choices) < 4:
                continue
            if not isinstance(answer_idx, int) or answer_idx not in range(4):
                continue

            q = (
                f"{question}\nChoices: "
                f"A) {choices[0]} B) {choices[1]} "
                f"C) {choices[2]} D) {choices[3]}"
            )
            queries.append(BenchmarkQuery(
                query=q,
                domain=item.get("subject", "unknown"),
                has_ground_truth=True,
                ground_truth=["A", "B", "C", "D"][answer_idx]
            ))
        return _deterministic_sample(queries, n=n, seed=seed)
    except (ImportError, OSError, ValueError, KeyError, IndexError) as e:
        print(f"[WARN] MMLU unavailable ({e}), using sample queries")
        return load_sample_queries(min(n, len(SAMPLE_QUERIES)), seed=seed)


def _deterministic_sample(
    queries: list[BenchmarkQuery],
    n: int,
    seed: int,
) -> list[BenchmarkQuery]:
    """
    Deterministically pseudo-shuffle queries without using random module APIs.
    """
    keyed = []
    for q in queries:
        digest = hashlib.sha256(f"{seed}:{q.domain}:{q.query}".encode("utf-8")).hexdigest()
        keyed.append((digest, q))
    keyed.sort(key=lambda item: item[0])
    return [item[1] for item in keyed[:n]]

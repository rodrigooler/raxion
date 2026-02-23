from __future__ import annotations

"""
Load benchmark queries for PoC convergence validation.

Primary dataset: MMLU (Massive Multitask Language Understanding)
Selected domains: STEM, reasoning, logic - where convergence is most meaningful.

Fallback: Hardcoded sample queries if MMLU unavailable.
"""
from dataclasses import dataclass
import random


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
    rng = random.Random(seed)
    queries = SAMPLE_QUERIES.copy()
    rng.shuffle(queries)
    return queries[:n]


def load_mmlu_queries(n: int = 100, seed: int = 42) -> list[BenchmarkQuery]:
    """
    Load MMLU queries from HuggingFace datasets.
    Falls back to sample queries if unavailable.
    """
    try:
        from datasets import load_dataset
        ds = load_dataset("cais/mmlu", "all", split="test", streaming=True)
        queries = []
        rng = random.Random(seed)
        for item in ds:
            if len(queries) >= n * 3:
                break
            q = (
                f"{item['question']}\nChoices: "
                f"A) {item['choices'][0]} B) {item['choices'][1]} "
                f"C) {item['choices'][2]} D) {item['choices'][3]}"
            )
            queries.append(BenchmarkQuery(
                query=q,
                domain=item.get("subject", "unknown"),
                has_ground_truth=True,
                ground_truth=["A", "B", "C", "D"][item["answer"]]
            ))
        rng.shuffle(queries)
        return queries[:n]
    except Exception as e:
        print(f"[WARN] MMLU unavailable ({e}), using sample queries")
        return load_sample_queries(min(n, len(SAMPLE_QUERIES)))

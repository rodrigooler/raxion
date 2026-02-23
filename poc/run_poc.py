#!/usr/bin/env python3
"""
RAXION Phase 0 PoC - Convergence Validation Runner

Runs queries through two architectures (Transformer + SSM proxy) and
computes CoherenceScore for each, reporting aggregate statistics.

Usage:
    python poc/run_poc.py                         # 10 sample queries
    python poc/run_poc.py --n 100 --mmlu          # 100 MMLU queries
    python poc/run_poc.py --query "What is ZKP?"  # single query
    python poc/run_poc.py --output results.json   # save results
"""
import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Allow running from repo root
sys.path.insert(0, str(Path(__file__).parent.parent))

from poc.architectures import (
    TransformerArchitecture,
    SSMProxyArchitecture,
    InferenceOutput,
    check_ollama_available,
    check_openrouter_configured,
)
from poc.convergence import compute_coherence_score, ConvergenceCategory
from poc.benchmarks.dataset import load_sample_queries, load_mmlu_queries, BenchmarkQuery


def run_single_query(
    query: str,
    transformer: TransformerArchitecture,
    ssm: SSMProxyArchitecture,
    verbose: bool = True,
) -> dict:
    """Run a single query through both architectures and compute CoherenceScore."""
    if verbose:
        print(f"\n{'='*60}")
        print(f"QUERY: {query[:80]}{'...' if len(query) > 80 else ''}")

    try:
        out_t = transformer.timed_infer(query)
    except Exception as err:
        out_t = InferenceOutput(
            architecture="transformer",
            query=query,
            output=f"[ERROR] transformer inference failed: {err}",
            latency_ms=0.0,
            model_id=transformer.model_id,
            metadata={"error": True},
        )

    try:
        out_s = ssm.timed_infer(query)
    except Exception as err:
        out_s = InferenceOutput(
            architecture="ssm",
            query=query,
            output=f"[ERROR] ssm inference failed: {err}",
            latency_ms=0.0,
            model_id=ssm.model_id,
            metadata={"error": True},
        )

    if verbose:
        print(f"\n[Transformer ({out_t.latency_ms:.0f}ms)]")
        print(f"  {out_t.output[:200]}{'...' if len(out_t.output) > 200 else ''}")
        print(f"\n[SSM ({out_s.latency_ms:.0f}ms)]")
        print(f"  {out_s.output[:200]}{'...' if len(out_s.output) > 200 else ''}")

    result = compute_coherence_score(out_t.output, out_s.output)

    if verbose:
        print(f"\n[CoherenceScore]")
        print(f"  Score:       {result.score:.3f}")
        print(f"  Category:    {result.category.value}")
        print(f"  CS_semantic: {result.cs_semantic:.3f}")
        print(f"  CC_approx:   {result.cc_approximate:.3f}")
        print(f"  Sim(T,S):    {result.sim_ts:.3f}")
        print(f"  Is Final:    {'YES' if result.is_final else 'NO'}")

    return {
        "query": query,
        "output_transformer": out_t.output,
        "output_ssm": out_s.output,
        "latency_transformer_ms": out_t.latency_ms,
        "latency_ssm_ms": out_s.latency_ms,
        "coherence_score": result.score,
        "category": result.category.value,
        "cs_semantic": result.cs_semantic,
        "cc_approximate": result.cc_approximate,
        "sim_ts": result.sim_ts,
        "is_final": result.is_final,
    }


def run_benchmark(
    queries: list[BenchmarkQuery],
    transformer: TransformerArchitecture,
    ssm: SSMProxyArchitecture,
    output_path: str | None = None,
) -> dict:
    """Run full benchmark and report aggregate statistics."""
    results = []

    print(f"\n{'='*60}")
    print("RAXION Phase 0 PoC - Convergence Benchmark")
    print(f"Architectures: Transformer ({transformer.model_id}) + SSM ({ssm.model_id})")
    print(f"Queries: {len(queries)}")
    print(f"Started: {datetime.now().isoformat()}")
    print(f"{'='*60}")

    for i, q in enumerate(queries, 1):
        print(f"\n[{i}/{len(queries)}]", end="")
        result = run_single_query(q.query, transformer, ssm, verbose=True)
        result["domain"] = q.domain
        result["has_ground_truth"] = q.has_ground_truth
        results.append(result)

    scores = [r["coherence_score"] for r in results]
    categories = [r["category"] for r in results]

    stats = {
        "total_queries": len(results),
        "avg_coherence_score": sum(scores) / len(scores),
        "min_coherence_score": min(scores),
        "max_coherence_score": max(scores),
        "pct_final": sum(1 for r in results if r["is_final"]) / len(results) * 100,
        "category_counts": {
            cat.value: categories.count(cat.value)
            for cat in ConvergenceCategory
        },
        "hypothesis_h1_validated": (
            sum(1 for r in results if r["is_final"]) / len(results) > 0.70
        ),
    }

    print(f"\n{'='*60}")
    print("BENCHMARK RESULTS")
    print(f"{'='*60}")
    print(f"Average CoherenceScore: {stats['avg_coherence_score']:.3f}")
    print(f"Min / Max: {stats['min_coherence_score']:.3f} / {stats['max_coherence_score']:.3f}")
    print(f"Cognitive Finality rate: {stats['pct_final']:.1f}%")
    print("\nCategory Distribution:")
    for cat, count in stats["category_counts"].items():
        pct = count / len(results) * 100
        bar = "#" * int(pct / 5)
        print(f"  {cat:<20} {count:>3} ({pct:>5.1f}%) {bar}")

    target = 70.0
    actual = stats["pct_final"]
    status = "PASSED" if stats["hypothesis_h1_validated"] else "FAILED"
    print(f"\nHypothesis H1 (convergence >70%): {status}")
    print(f"  Target: {target:.0f}% | Actual: {actual:.1f}%")

    if output_path:
        output = {"metadata": stats, "results": results}
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2)
        print(f"\nResults saved to: {output_path}")

    return stats


def _validate_provider(provider: str, transformer_model: str) -> None:
    if provider == "openrouter":
        if not check_openrouter_configured():
            print("[ERROR] OPENROUTER_API_KEY is not configured.")
            print("Run: export OPENROUTER_API_KEY=...")
            sys.exit(1)
    elif provider == "ollama":
        if not check_ollama_available(transformer_model):
            print(f"[ERROR] Model {transformer_model} not found in Ollama.")
            print(f"Run: ollama pull {transformer_model}")
            sys.exit(1)
    elif provider == "mock":
        return
    else:
        print("[ERROR] --provider must be 'openrouter', 'ollama', or 'mock'.")
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="RAXION Phase 0 Convergence PoC")
    parser.add_argument("--query", type=str, help="Single query to run")
    parser.add_argument("--n", type=int, default=10, help="Number of benchmark queries")
    parser.add_argument("--mmlu", action="store_true", help="Use MMLU dataset")
    parser.add_argument("--output", type=str, help="Save results to JSON file")
    parser.add_argument("--provider", default=os.getenv("RAXION_LLM_PROVIDER", "openrouter"))
    parser.add_argument("--transformer-model", default="arcee-ai/trinity-large-preview:free")
    parser.add_argument("--ssm-model", default="z-ai/glm-4.5-air:free")
    args = parser.parse_args()

    _validate_provider(args.provider, args.transformer_model)

    transformer = TransformerArchitecture(
        model=args.transformer_model,
        provider=args.provider,
    )
    ssm = SSMProxyArchitecture(
        model=args.ssm_model,
        provider=args.provider,
    )

    if args.query:
        run_single_query(args.query, transformer, ssm, verbose=True)
    else:
        queries = load_mmlu_queries(n=args.n) if args.mmlu else load_sample_queries(n=args.n)
        run_benchmark(queries, transformer, ssm, output_path=args.output)


if __name__ == "__main__":
    main()

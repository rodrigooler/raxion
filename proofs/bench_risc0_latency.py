#!/usr/bin/env python3
"""
Benchmark RISC Zero proof latency across payload sizes.

Outputs:
  - proofs/benchmarks/risc0_latency_results.json
  - docs/benchmarks/risc0-latency-q1-2026.md
"""

from __future__ import annotations

import json
import os
import platform
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
PROOFS_DIR = REPO_ROOT / "proofs"
RESULTS_DIR = PROOFS_DIR / "benchmarks"
RESULTS_JSON = RESULTS_DIR / "risc0_latency_results.json"
REPORT_MD = REPO_ROOT / "docs" / "benchmarks" / "risc0-latency-q1-2026.md"
SIZES = [
    {"name": "xs", "input_bytes": 64, "output_bytes": 256},
    {"name": "s", "input_bytes": 128, "output_bytes": 512},
    {"name": "m", "input_bytes": 256, "output_bytes": 1024},
    {"name": "l", "input_bytes": 512, "output_bytes": 2048},
    {"name": "xl", "input_bytes": 1024, "output_bytes": 4096},
]


def hardware_profile() -> dict[str, Any]:
    return {
        "os": platform.platform(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "python": platform.python_version(),
        "cpu_count": os.cpu_count(),
        "rustc": _run_quiet(["rustc", "--version"]),
        "cargo": _run_quiet(["cargo", "--version"]),
    }


def _run_quiet(cmd: list[str]) -> str:
    path = shutil.which(cmd[0])
    if not path:
        return "not-found"
    out = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=False,
    )
    if out.returncode != 0:
        return f"error({out.returncode})"
    return out.stdout.strip()


def run_case(input_bytes: int, output_bytes: int) -> dict[str, Any]:
    cmd = [
        "cargo",
        "run",
        "-p",
        "risc0-host",
        "--release",
        "--",
        "--input-bytes",
        str(input_bytes),
        "--output-bytes",
        str(output_bytes),
        "--architecture",
        "transformer",
        "--json",
    ]
    env = dict(os.environ)
    env.setdefault("RISC0_DEV_MODE", "1")
    env.setdefault("RISC0_SKIP_BUILD_KERNELS", "1")

    proc = subprocess.run(
        cmd,
        cwd=PROOFS_DIR,
        capture_output=True,
        text=True,
        env=env,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"Command failed ({proc.returncode}): {' '.join(cmd)}\n{proc.stderr}"
        )
    lines = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
    payload = json.loads(lines[-1])
    return payload


def recommendation(avg_prove_time: float) -> str:
    if avg_prove_time > 10.0:
        return (
            "Priorizar batching e pré-compilação de métodos no Q2 para reduzir custo de prova em CPU."
        )
    return (
        "Executar benchmark adicional em modo não-dev com payloads reais e comparar com instância GPU no Q2."
    )


def write_markdown(report: dict[str, Any]) -> None:
    REPORT_MD.parent.mkdir(parents=True, exist_ok=True)

    rows = []
    for case in report["results"]:
        rows.append(
            f"| {case['name']} | {case['input_bytes']} | {case['output_bytes']} | "
            f"{case['prove_time_s']:.3f} | {case['verify_time_s']:.3f} | {case['total_time_s']:.3f} |"
        )

    md = "\n".join(
        [
            "# RISC Zero Latency Benchmark (Q1 2026)",
            "",
            f"Date: {report['metadata']['date_utc']}",
            f"Config: RISC0_DEV_MODE={report['metadata']['risc0_dev_mode']} | "
            f"RISC0_SKIP_BUILD_KERNELS={report['metadata']['skip_build_kernels']}",
            "",
            "## Hardware",
            "",
            f"- OS: `{report['hardware']['os']}`",
            f"- Machine: `{report['hardware']['machine']}`",
            f"- CPU: `{report['hardware']['processor'] or 'unknown'}`",
            f"- Cores: `{report['hardware']['cpu_count']}`",
            f"- Rust: `{report['hardware']['rustc']}`",
            "",
            "## Results",
            "",
            "| size | input_bytes | output_bytes | prove_time_s | verify_time_s | total_time_s |",
            "|---|---:|---:|---:|---:|---:|",
            *rows,
            "",
            "## Summary",
            "",
            f"- Average prove time: `{report['summary']['avg_prove_time_s']:.3f}s`",
            f"- Average verify time: `{report['summary']['avg_verify_time_s']:.3f}s`",
            f"- Deterministic commitments: `{report['summary']['deterministic_commitments']}`",
            "",
            "## Q2 Recommendation",
            "",
            f"- {report['summary']['q2_recommendation']}",
            "",
        ]
    )

    REPORT_MD.write_text(md, encoding="utf-8")


def main() -> None:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    results: list[dict[str, Any]] = []
    for case in SIZES:
        print(
            f"[bench] {case['name']} input={case['input_bytes']} output={case['output_bytes']}"
        )
        item = run_case(case["input_bytes"], case["output_bytes"])
        item["name"] = case["name"]
        results.append(item)

    replay_case = SIZES[0]
    replay_a = run_case(replay_case["input_bytes"], replay_case["output_bytes"])
    replay_b = run_case(replay_case["input_bytes"], replay_case["output_bytes"])
    avg_prove = sum(item["prove_time_s"] for item in results) / len(results)
    avg_verify = sum(item["verify_time_s"] for item in results) / len(results)

    report: dict[str, Any] = {
        "metadata": {
            "date_utc": datetime.now(timezone.utc).isoformat(),
            "risc0_dev_mode": os.getenv("RISC0_DEV_MODE", "1"),
            "skip_build_kernels": os.getenv("RISC0_SKIP_BUILD_KERNELS", "1"),
            "command": "python proofs/bench_risc0_latency.py",
        },
        "hardware": hardware_profile(),
        "results": results,
        "summary": {
            "avg_prove_time_s": avg_prove,
            "avg_verify_time_s": avg_verify,
            "deterministic_commitments": replay_a["joint_commitment"] == replay_b["joint_commitment"],
            "q2_recommendation": recommendation(avg_prove),
        },
    }

    RESULTS_JSON.write_text(json.dumps(report, indent=2), encoding="utf-8")
    write_markdown(report)
    print(f"[ok] wrote {RESULTS_JSON}")
    print(f"[ok] wrote {REPORT_MD}")


if __name__ == "__main__":
    main()

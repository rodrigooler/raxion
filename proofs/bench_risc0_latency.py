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
QUIET_CMD_TIMEOUT_S = 20
BENCH_CMD_TIMEOUT_S = 1800


class CommandError(RuntimeError):
    def __init__(self, message: str, details: str | None = None) -> None:
        super().__init__(message)
        self.details = details

    def __str__(self) -> str:
        base = super().__str__()
        if not self.details:
            return base
        return f"{base}\n{self.details}"


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
    try:
        out = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False,
            timeout=QUIET_CMD_TIMEOUT_S,
        )
    except subprocess.TimeoutExpired:
        return "timeout"
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

    try:
        proc = subprocess.run(
            cmd,
            cwd=PROOFS_DIR,
            capture_output=True,
            text=True,
            env=env,
            check=False,
            timeout=BENCH_CMD_TIMEOUT_S,
        )
    except subprocess.TimeoutExpired as err:
        detail = (
            f"Command timed out after {BENCH_CMD_TIMEOUT_S}s.\n"
            f"cmd={' '.join(cmd)}\nstdout={err.stdout}\nstderr={err.stderr}"
        )
        raise CommandError(
            f"Benchmark case timed out for input={input_bytes}, output={output_bytes}",
            detail,
        ) from err
    if proc.returncode != 0:
        detail = (
            f"returncode={proc.returncode}\n"
            f"cmd={' '.join(cmd)}\nstdout={proc.stdout}\nstderr={proc.stderr}"
        )
        raise CommandError(
            f"Benchmark command failed for input={input_bytes}, output={output_bytes}",
            detail,
        )
    lines = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
    if not lines:
        detail = (
            f"returncode={proc.returncode}\n"
            f"cmd={' '.join(cmd)}\nstdout={proc.stdout}\nstderr={proc.stderr}"
        )
        raise CommandError(
            "Benchmark command produced no parsable JSON output",
            detail,
        )
    payload = json.loads(lines[-1])
    return payload


def recommendation(avg_prove_time: float) -> str:
    if avg_prove_time > 10.0:
        return (
            "Prioritize batching and method pre-compilation in Q2 to reduce CPU proving cost."
        )
    return (
        "Run additional non-dev benchmarks with real payloads and compare against a GPU instance in Q2."
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

    replay_small = SIZES[0]
    replay_mid = SIZES[2]
    replay_small_a = run_case(replay_small["input_bytes"], replay_small["output_bytes"])
    replay_small_b = run_case(replay_small["input_bytes"], replay_small["output_bytes"])
    replay_mid_a = run_case(replay_mid["input_bytes"], replay_mid["output_bytes"])
    replay_mid_b = run_case(replay_mid["input_bytes"], replay_mid["output_bytes"])
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
            "deterministic_commitments": (
                replay_small_a["joint_commitment"] == replay_small_b["joint_commitment"]
                and replay_mid_a["joint_commitment"] == replay_mid_b["joint_commitment"]
            ),
            "q2_recommendation": recommendation(avg_prove),
        },
    }

    RESULTS_JSON.write_text(json.dumps(report, indent=2), encoding="utf-8")
    write_markdown(report)
    print(f"[ok] wrote {RESULTS_JSON}")
    print(f"[ok] wrote {REPORT_MD}")


if __name__ == "__main__":
    main()

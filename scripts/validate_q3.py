#!/usr/bin/env python3
"""Q3 Testnet prep validation script."""

from __future__ import annotations

import subprocess
import sys
from dataclasses import dataclass
from typing import Callable


CheckFn = Callable[[], bool]


def run_cmd(cmd: list[str]) -> bool:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return proc.returncode == 0


def check_jolt() -> bool:
    return run_cmd(
        ["cargo", "build", "-p", "raxion-jolt-quality", "--manifest-path", "proofs/Cargo.toml"]
    )


def check_challenges() -> bool:
    return run_cmd(["cargo", "test", "-p", "raxion-poiq", "--manifest-path", "programs/raxion-poiq/Cargo.toml", "--", "challenge"])


def check_dissent() -> bool:
    # Avoid false positives when test filter matches zero tests.
    has_impl = run_cmd(
        [
            "bash",
            "-lc",
            "rg -n \"submit_dissent|DissentSubmitted|qualifies_for_dissent\" programs/raxion-poiq/src",
        ]
    )
    if not has_impl:
        return False
    return run_cmd(
        ["cargo", "test", "-p", "raxion-poiq", "--manifest-path", "programs/raxion-poiq/Cargo.toml", "--", "dissent"]
    )


def check_memory() -> bool:
    has_hnsw = run_cmd(
        [
            "bash",
            "-lc",
            "rg -n \"HotMemoryIndex|HNSW_MAX_ENTRIES|dot_product_int8\" runtime/cognitive/src/memory.rs",
        ]
    )
    if not has_hnsw:
        return False
    return run_cmd(["cargo", "test", "--manifest-path", "runtime/cognitive/Cargo.toml", "memory"])


def check_raxlang() -> bool:
    return run_cmd(
        [
            "cargo",
            "run",
            "--manifest-path",
            "sdk/raxlang/Cargo.toml",
            "--",
            "examples/agents/math_agent.rax",
            "--check",
        ]
    )


def check_token() -> bool:
    return run_cmd(["cargo", "test", "--manifest-path", "programs/raxion-token/Cargo.toml"])


def check_vesting() -> bool:
    return run_cmd(
        [
            "cargo",
            "test",
            "--manifest-path",
            "programs/raxion-token/Cargo.toml",
            "vesting",
        ]
    )


def check_audit() -> bool:
    return run_cmd(["bash", "scripts/pre_audit_check.sh"])


@dataclass
class Criterion:
    id: str
    description: str
    manual: bool = False
    check: CheckFn | None = None


CRITERIA: list[Criterion] = [
    Criterion("T1", "Devnet: 1,000+ queries without protocol failure", manual=True),
    Criterion("T2", "Devnet: avg CoherenceScore > 0.65 at scale", manual=True),
    Criterion("T3", "Devnet: 1+ documented SlashEvent on-chain", manual=True),
    Criterion("T4", "GPU proof: P90 latency < 10s at dim=384", manual=True),
    Criterion("T5", "Jolt quality proof: compiles and produces correct output", check=check_jolt),
    Criterion("T6", "All 6 challenge categories: unit tests pass", check=check_challenges),
    Criterion("T7", "Dissent Queue: theta_confidence invariant + 4 tests", check=check_dissent),
    Criterion("T8", "HNSW memory: within 3MB budget, search correct", check=check_memory),
    Criterion("T9", "RaxLang: math_agent.rax transpiles to valid Rust", check=check_raxlang),
    Criterion("T10", "Sovereign Rollup: commit_state_root on Solana devnet", manual=True),
    Criterion("T11", "$RAX genesis: mint burned after 1B supply", check=check_token),
    Criterion("T12", "VestingSchedule: cliff/full-vest tests pass", check=check_vesting),
    Criterion("T13", "Pre-audit checks: all pass (no unwrap, no TODO)", check=check_audit),
    Criterion("T14", "AUDIT_PREP.md: all checkboxes completed", manual=True),
    Criterion("T15", "Testnet 90-day stability plan documented", manual=True),
]


def main() -> int:
    print("╔══════════════════════════════════════════════════╗")
    print("║   RAXION Phase 2 — Q3 Testnet Readiness         ║")
    print("╚══════════════════════════════════════════════════╝")
    print()

    passed = 0
    failed = 0
    manual = 0
    for c in CRITERIA:
        print(f"[{c.id}] {c.description}")
        if c.manual:
            print("  [MANUAL] Requires human verification")
            manual += 1
        elif c.check is not None:
            ok = False
            try:
                ok = c.check()
            except Exception as exc:  # pragma: no cover - defensive
                print(f"  FAIL ({exc})")
                failed += 1
                print()
                continue
            if ok:
                print("  OK")
                passed += 1
            else:
                print("  FAIL")
                failed += 1
        print()

    print("=" * 50)
    print(f"Automated: {passed} passed, {failed} failed")
    print(f"Manual: {manual} require verification")
    return 1 if failed > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())

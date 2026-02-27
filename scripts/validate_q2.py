#!/usr/bin/env python3
"""Python wrapper for the Q2 validation shell script.

Q3 entry conditions reference `scripts/validate_q2.py`. This wrapper keeps
that interface stable and forwards execution to `scripts/validate_q2.sh`.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    script = repo_root / "scripts" / "validate_q2.sh"
    if not script.exists():
        print(f"missing script: {script}", file=sys.stderr)
        return 1

    proc = subprocess.run(["bash", str(script)], cwd=repo_root)
    return proc.returncode


if __name__ == "__main__":
    raise SystemExit(main())

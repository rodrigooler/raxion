# RAXION

> The first sovereign Layer-1 where AI inference quality is mathematically proven — not voted.

RAXION replaces subjective human consensus (Bittensor model) with **Proof of Inference Quality (PoIQ)**: a three-layer cryptographic protocol built on a Neural Sovereign Virtual Machine (Neural SVM) as a Sovereign SVM Rollup on Solana.

## Status

🟡 **Phase 0 — Genesis (Q1 2026)**: Convergence PoC + RISC Zero integration

## Quick Start (PoC)

```bash
# Requirements: Python 3.11+
python3 -m venv .venv
source .venv/bin/activate
pip install -r poc/requirements.txt

# Option A (recommended for Phase 0 tests): OpenRouter free models
export OPENROUTER_API_KEY="..."
python poc/run_poc.py --provider openrouter --query "Explain the Oracle Problem in blockchain"

# Option B: deterministic local smoke tests
python poc/run_poc.py --provider mock --n 10 --output poc/benchmarks/results_q1.json
```

## Documentation

- [Whitepaper v1.0 (EN)](docs/whitepaper/RAXION_Whitepaper_v1.0_EN.md)
- [Agent Context](AGENTS.md)
- [Claude Context](CLAUDE.md)

## License

BUSL 1.1 → MIT on 2030-02-20. SDKs: Apache 2.0.

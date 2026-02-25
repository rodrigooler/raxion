# MMLU Convergence Benchmark (Q1 2026)

Date: 2026-02-23  
Command:

```bash
python poc/run_poc.py \
  --provider mock \
  --mmlu \
  --n 100 \
  --seed 42 \
  --output poc/benchmarks/mmlu_100_mock_seed42.json
```

## Results

- Total queries: `100`
- Seed: `42`
- Average CoherenceScore: `0.9076`
- Min / Max CoherenceScore: `0.8331 / 0.9648`
- Cognitive Finality rate (`score >= 0.60`): `100.0%`
- H1 status (`> 70% finality`): `PASSED`

### Category distribution

| Category | Count | Percent |
|---|---:|---:|
| REJECTED | 0 | 0.0% |
| LOW_CONFIDENCE | 0 | 0.0% |
| STANDARD | 7 | 7.0% |
| HIGH_COHERENCE | 93 | 93.0% |

## Caveats

- This run used `--provider mock`, so outputs are deterministic synthetic responses intended for pipeline validation.
- The result validates reproducibility, data-flow and scoring behavior for 100 MMLU prompts, but it does not measure real model disagreement.
- For Q2 readiness, rerun with live providers (`openrouter` or local models) and compare the finality rate against this baseline.

## Raw artifact

- [`poc/benchmarks/mmlu_100_mock_seed42.json`](poc/benchmarks/mmlu_100_mock_seed42.json)

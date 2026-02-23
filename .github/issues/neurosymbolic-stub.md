## Summary

Add a third architecture stub (`poc/architectures/neurosymbolic.py`) to the PoC.

## Background

RAXION's Cross-Validation Neural uses three architecture types:
1. ✅ Transformer (`transformer.py`)
2. ✅ SSM proxy (`ssm_proxy.py`)
3. ❌ **Neuro-Symbolic** (this issue)

The Neuro-Symbolic architecture combines neural networks with formal logical reasoning.
For the Phase 0 PoC, a stub implementation using rule-based extraction + an LLM for
structured output is sufficient.

## Requirements

- [ ] Create `poc/architectures/neurosymbolic.py`
- [ ] Implement `NeuroSymbolicArchitecture(BaseArchitecture)`
- [ ] System prompt should emphasize: logical decomposition, explicit premise listing, uncertainty flagging
- [ ] Add to `poc/architectures/__init__.py`
- [ ] Demonstrate `compute_coherence_score(out_t, out_s, out_n)` with all three outputs

## References

- `AGENTS.md` → Core Concepts → The Three Architectures
- `poc/architectures/base.py` → interface to implement
- Whitepaper Chapter 2.4.2 for characteristic biases

## Acceptance Criteria

```
✓ NeuroSymbolicArchitecture().infer("What is 2+2?") returns InferenceOutput
✓ three-architecture CoherenceScore runs without error
✓ Unit test added to poc/tests/
```

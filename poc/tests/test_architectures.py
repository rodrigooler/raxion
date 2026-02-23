from poc.architectures import (
    NeuroSymbolicArchitecture,
    SSMProxyArchitecture,
    TransformerArchitecture,
)
from poc.convergence import compute_coherence_score


def test_neurosymbolic_infer_returns_output() -> None:
    model = NeuroSymbolicArchitecture(provider="mock")
    result = model.infer("What is 2+2?")
    assert result.architecture == "neurosymbolic"
    assert isinstance(result.output, str)
    assert result.output.strip() != ""


def test_three_architecture_coherence_runs() -> None:
    query = "Explain why deterministic proofs improve trust in distributed systems."
    transformer = TransformerArchitecture(provider="mock")
    ssm = SSMProxyArchitecture(provider="mock")
    neuro = NeuroSymbolicArchitecture(provider="mock")

    out_t = transformer.infer(query).output
    out_s = ssm.infer(query).output
    out_n = neuro.infer(query).output

    result = compute_coherence_score(out_t, out_s, out_n)
    assert 0.0 <= result.score <= 1.0
    assert result.output_n == out_n

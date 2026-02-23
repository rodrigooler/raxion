"""
Tests for PoIQ Layer 1 - CoherenceScore

These tests verify the implementation matches Whitepaper Chapter 3.
Any formula change that breaks these tests requires whitepaper update too.
"""
import pytest
import numpy as np
from poc.convergence import (
    compute_coherence_score,
    ConvergenceCategory,
    THRESHOLD_REJECT,
    THRESHOLD_STANDARD,
    THRESHOLD_HIGH,
)
from poc.convergence.embeddings import cosine_similarity
from poc.convergence.coherence import _geometric_mean


# Unit Tests: geometric mean

class TestGeometricMean:
    def test_equal_values(self):
        """Geometric mean of equal values equals that value."""
        assert abs(_geometric_mean([0.5, 0.5, 0.5]) - 0.5) < 1e-6

    def test_zero_input(self):
        """Geometric mean with zero returns zero (not undefined)."""
        assert _geometric_mean([0.0, 0.8, 0.8]) == pytest.approx(0.0, abs=1e-12)

    def test_penalizes_outlier_more_than_arithmetic(self):
        """Geometric mean is lower than arithmetic for uneven values."""
        values = [0.9, 0.9, 0.1]
        geo = _geometric_mean(values)
        arith = sum(values) / len(values)
        assert geo < arith, "Geometric mean should penalize outlier pair more"

    def test_all_ones(self):
        assert abs(_geometric_mean([1.0, 1.0, 1.0]) - 1.0) < 1e-6


# Unit Tests: cosine similarity

class TestCosineSimilarity:
    def test_identical_vectors(self):
        v = np.array([1.0, 0.0, 0.0])
        assert abs(cosine_similarity(v, v) - 1.0) < 1e-6

    def test_orthogonal_vectors(self):
        a = np.array([1.0, 0.0])
        b = np.array([0.0, 1.0])
        assert abs(cosine_similarity(a, b)) < 1e-6

    def test_opposite_vectors(self):
        a = np.array([1.0, 0.0])
        b = np.array([-1.0, 0.0])
        assert abs(cosine_similarity(a, b) - (-1.0)) < 1e-6

    def test_requires_normalized_input(self):
        with pytest.raises(ValueError):
            cosine_similarity(np.array([2.0, 0.0]), np.array([1.0, 0.0]))


# Integration Tests: CoherenceScore

class TestCoherenceScore:
    """
    These tests use actual embeddings - they require sentence-transformers to be installed.
    They validate semantic behavior, not exact numerical values.
    """

    def test_identical_outputs_high_coherence(self):
        """Identical outputs from both architectures should yield high CoherenceScore."""
        text = "The Oracle Problem in blockchain refers to the challenge of reliably importing external data."
        result = compute_coherence_score(text, text)
        assert result.score >= THRESHOLD_HIGH, (
            f"Identical outputs should yield HIGH_COHERENCE. Got {result.score:.3f}"
        )
        assert result.category == ConvergenceCategory.HIGH_COHERENCE

    def test_semantically_similar_standard_convergence(self):
        """Similar but not identical outputs should yield standard convergence."""
        output_t = "Bittensor uses human validators with economic incentives to judge AI quality."
        output_s = "In Bittensor, validators are financially rewarded to evaluate AI outputs."
        result = compute_coherence_score(output_t, output_s)
        assert result.score >= THRESHOLD_STANDARD, (
            f"Similar outputs should reach STANDARD convergence. Got {result.score:.3f}"
        )

    def test_unrelated_outputs_below_standard(self):
        """Outputs on completely different topics should score below STANDARD."""
        output_t = "Zero-knowledge proofs allow verification without revealing the witness."
        output_s = "The French Revolution began in 1789 with the storming of the Bastille."
        result = compute_coherence_score(output_t, output_s)
        assert result.score < THRESHOLD_STANDARD, (
            f"Unrelated outputs should score below STANDARD. Got {result.score:.3f}"
        )

    def test_score_components_sum_correctly(self):
        """CoherenceScore = 0.4xCS_semantic + 0.6xCC."""
        from poc.convergence.coherence import ALPHA, BETA
        text_a = "Neural networks learn from data through gradient descent."
        text_b = "Machine learning models are trained using backpropagation."
        result = compute_coherence_score(text_a, text_b)
        expected = ALPHA * result.cs_semantic + BETA * result.cc_approximate
        assert abs(result.score - expected) < 1e-6, (
            f"Score {result.score} should equal ALPHAxCS + BETAxCC = {expected}"
        )

    def test_coherence_result_is_final_flag(self):
        """is_final should be True iff score >= THRESHOLD_STANDARD."""
        text = "Solana uses a Proof of History mechanism for time ordering."
        result = compute_coherence_score(text, text)
        assert result.is_final == (result.score >= THRESHOLD_STANDARD)

    def test_three_arch_mode(self):
        """Three architecture mode should be supported."""
        t = "zk-ML proofs verify inference integrity cryptographically."
        s = "Zero-knowledge machine learning proves computation was done correctly."
        n = "Cryptographic proofs can verify that a model inference was performed with integrity."
        result = compute_coherence_score(t, s, n)
        assert result.score >= 0.0
        assert result.output_n == n


# Protocol Invariant Tests

class TestProtocolInvariants:
    """
    These tests enforce non-negotiable protocol properties from AGENTS.md.
    Breaking any of these requires a whitepaper amendment.
    """

    def test_coherence_score_bounded_0_1(self):
        """CoherenceScore must always be in [0, 1]."""
        pairs = [
            ("hello", "world"),
            ("a", "a"),
            ("", "something"),
        ]
        for a, b in pairs:
            result = compute_coherence_score(a, b)
            assert 0.0 <= result.score <= 1.0, f"Score {result.score} out of bounds"

    def test_rejection_threshold_is_0_30(self):
        """Protocol spec: THRESHOLD_REJECT = 0.30"""
        assert THRESHOLD_REJECT == pytest.approx(0.30, abs=1e-12), (
            "Rejection threshold changed - requires whitepaper update"
        )

    def test_standard_threshold_is_0_60(self):
        """Protocol spec: THRESHOLD_STANDARD = 0.60"""
        assert THRESHOLD_STANDARD == pytest.approx(0.60, abs=1e-12), (
            "Standard threshold changed - requires whitepaper update"
        )

    def test_high_threshold_is_0_85(self):
        """Protocol spec: THRESHOLD_HIGH = 0.85"""
        assert THRESHOLD_HIGH == pytest.approx(0.85, abs=1e-12), (
            "High threshold changed - requires whitepaper update"
        )

    def test_alpha_beta_sum_to_1(self):
        """Protocol spec: alpha + beta = 1.0"""
        from poc.convergence.coherence import ALPHA, BETA
        assert abs(ALPHA + BETA - 1.0) < 1e-9, "alpha + beta must equal 1.0"

    def test_alpha_is_0_4(self):
        from poc.convergence.coherence import ALPHA
        assert ALPHA == pytest.approx(0.4, abs=1e-12), "alpha changed - requires whitepaper update"

    def test_beta_is_0_6(self):
        from poc.convergence.coherence import BETA
        assert BETA == pytest.approx(0.6, abs=1e-12), "beta changed - requires whitepaper update"

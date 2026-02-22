"""
RAXION PoIQ Layer 1: Statistical Convergence

Implements the formal definitions from Whitepaper Chapter 3:

Definition 2 - Semantic Convergence Score (CS_semantic):
    CS_semantic = (sim(T,S) x sim(T,N) x sim(S,N))^(1/3)
    Uses geometric mean - more penalizing for outlier pairs than arithmetic mean.

Definition 3 - Causal Coherence (CC):
    CC = 0.3xconsistency(P) + 0.5xagreement(C) + 0.2xentailment_rate
    NOTE: In PoC, CC is approximated via semantic similarity of extracted key claims.
    Full causal extraction requires Neuro-Symbolic architecture (Devnet+).

Definition 4 - Final CoherenceScore:
    CoherenceScore = 0.4xCS_semantic + 0.6xCC

Thresholds:
    < 0.30  -> REJECTED
    0.30-0.60 -> LOW_CONFIDENCE
    0.60-0.85 -> STANDARD
    > 0.85  -> HIGH_COHERENCE
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional
import numpy as np

from .embeddings import embed, cosine_similarity


# Protocol parameters - must match whitepaper Chapter 3
ALPHA = 0.4          # weight of CS_semantic
BETA = 0.6           # weight of CC
W_PREMISE = 0.3      # CC: premise consistency weight
W_CONCLUSION = 0.5   # CC: conclusion agreement weight
W_ENTAILMENT = 0.2   # CC: entailment rate weight

THRESHOLD_REJECT = 0.30
THRESHOLD_STANDARD = 0.60
THRESHOLD_HIGH = 0.85


class ConvergenceCategory(str, Enum):
    REJECTED = "REJECTED"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    STANDARD = "STANDARD"
    HIGH_COHERENCE = "HIGH_COHERENCE"


@dataclass
class CoherenceResult:
    """Full result of CoherenceScore computation."""
    score: float
    category: ConvergenceCategory
    cs_semantic: float
    cc_approximate: float

    # Pairwise similarities (T=Transformer, S=SSM, N=NeuroSymbolic)
    sim_ts: float
    sim_tn: float
    sim_sn: float

    # Metadata
    output_t: str
    output_s: str
    output_n: Optional[str]
    embedding_model: str

    @property
    def is_final(self) -> bool:
        """True if output meets minimum convergence for Cognitive Finality."""
        return self.score >= THRESHOLD_STANDARD

    def __repr__(self) -> str:
        return (
            f"CoherenceResult("
            f"score={self.score:.3f}, "
            f"category={self.category.value}, "
            f"cs_semantic={self.cs_semantic:.3f}, "
            f"cc={self.cc_approximate:.3f})"
        )


def _similarity_score(a: np.ndarray, b: np.ndarray) -> float:
    """Project cosine similarity to [0, 1] while penalizing unrelated pairs."""
    return float(np.clip(cosine_similarity(a, b), 0.0, 1.0))


def _geometric_mean(values: list[float]) -> float:
    """
    Compute geometric mean of a list of values.

    Used for CS_semantic because it penalizes outlier pairs more than arithmetic mean.
    If any value is <= 0, returns 0.
    """
    arr = np.array(values, dtype=np.float64)
    if np.any(arr <= 0):
        return 0.0
    return float(np.exp(np.mean(np.log(arr))))


def _approximate_cc(
    output_t: str,
    output_s: str,
    output_n: Optional[str] = None,
    embedding_model: str = "all-MiniLM-L6-v2",
) -> float:
    """
    Approximate Causal Coherence (CC) for PoC.

    In the full protocol (Devnet+), CC requires:
    - Premise extraction via Neuro-Symbolic architecture
    - Logical consistency checking
    - Entailment verification

    In the PoC (2 architectures, no Neuro-Symbolic), we approximate CC
    using the same embedding similarity approach but applied to
    extracted key sentences rather than full outputs.

    This approximation will be replaced with proper causal extraction
    when the Neuro-Symbolic architecture is integrated.
    """

    def extract_key_sentences(text: str, n: int = 3) -> str:
        """Extract first N sentences as a proxy for main claims."""
        sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 20]
        return '. '.join(sentences[:n])

    claims_t = extract_key_sentences(output_t)
    claims_s = extract_key_sentences(output_s)

    emb_ct = embed(claims_t, embedding_model)
    emb_cs = embed(claims_s, embedding_model)
    conclusion_agreement = _similarity_score(emb_ct, emb_cs)

    if output_n:
        claims_n = extract_key_sentences(output_n)
        emb_cn = embed(claims_n, embedding_model)
        sim_tn = _similarity_score(emb_ct, emb_cn)
        sim_sn = _similarity_score(emb_cs, emb_cn)
        conclusion_agreement = (conclusion_agreement + sim_tn + sim_sn) / 3

    # Without true premise extraction, approximate consistency and entailment
    # with the same agreement signal to avoid inflating unrelated outputs.
    cc = (
        W_PREMISE * conclusion_agreement
        + W_CONCLUSION * conclusion_agreement
        + W_ENTAILMENT * conclusion_agreement
    )
    return float(np.clip(cc, 0.0, 1.0))


def compute_coherence_score(
    output_t: str,
    output_s: str,
    output_n: Optional[str] = None,
    embedding_model: str = "all-MiniLM-L6-v2",
) -> CoherenceResult:
    """
    Compute PoIQ Layer 1 CoherenceScore for two or three architecture outputs.

    Implements Whitepaper Chapter 3, Definitions 2-4.

    Args:
        output_t: Transformer architecture output
        output_s: SSM architecture output
        output_n: Neuro-Symbolic architecture output (optional in PoC)
        embedding_model: sentence-transformers model name

    Returns:
        CoherenceResult with score, category, and component metrics
    """
    # Generate embeddings
    emb_t = embed(output_t, embedding_model)
    emb_s = embed(output_s, embedding_model)

    # Pairwise cosine similarities projected to [0, 1]
    sim_ts = _similarity_score(emb_t, emb_s)

    if output_n:
        emb_n = embed(output_n, embedding_model)
        sim_tn = _similarity_score(emb_t, emb_n)
        sim_sn = _similarity_score(emb_s, emb_n)
    else:
        # PoC: 2 architectures only - use sim_ts for both missing pairs
        sim_tn = sim_ts
        sim_sn = sim_ts

    # Definition 2: CS_semantic (geometric mean)
    cs_semantic = _geometric_mean([sim_ts, sim_tn, sim_sn])

    # Definition 3: CC (approximate in PoC)
    cc = _approximate_cc(output_t, output_s, output_n, embedding_model)

    # Definition 4: CoherenceScore
    score = ALPHA * cs_semantic + BETA * cc
    score = float(np.clip(score, 0.0, 1.0))

    # Categorize
    if score < THRESHOLD_REJECT:
        category = ConvergenceCategory.REJECTED
    elif score < THRESHOLD_STANDARD:
        category = ConvergenceCategory.LOW_CONFIDENCE
    elif score < THRESHOLD_HIGH:
        category = ConvergenceCategory.STANDARD
    else:
        category = ConvergenceCategory.HIGH_COHERENCE

    return CoherenceResult(
        score=score,
        category=category,
        cs_semantic=cs_semantic,
        cc_approximate=cc,
        sim_ts=sim_ts,
        sim_tn=sim_tn,
        sim_sn=sim_sn,
        output_t=output_t,
        output_s=output_s,
        output_n=output_n,
        embedding_model=embedding_model,
    )

import numpy as np
from sentence_transformers import SentenceTransformer
import threading

# Thread-safe model loading
_model_lock = threading.Lock()
_model_cache: dict = {}


def get_embedding_model(model_name: str = "all-MiniLM-L6-v2") -> SentenceTransformer:
    """Load and cache embedding model (thread-safe)."""
    with _model_lock:
        if model_name not in _model_cache:
            _model_cache[model_name] = SentenceTransformer(model_name)
        return _model_cache[model_name]


def embed(text: str, model_name: str = "all-MiniLM-L6-v2") -> np.ndarray:
    """
    Generate embedding vector for a text string.

    Returns:
        numpy array of shape (embedding_dim,), L2-normalized
    """
    model = get_embedding_model(model_name)
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.astype(np.float32)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Compute cosine similarity between two L2-normalized vectors.

    Both inputs must already be L2-normalized (norm = 1.0).
    For normalized vectors: cosine_sim = dot product.

    Returns: float in [-1, 1]
    """
    if a.ndim != 1 or b.ndim != 1:
        raise ValueError("Inputs must be 1D vectors")

    norm_a = float(np.linalg.norm(a))
    norm_b = float(np.linalg.norm(b))
    if abs(norm_a - 1.0) >= 1e-5:
        raise ValueError(f"Vector a must be L2-normalized (got norm={norm_a:.6f})")
    if abs(norm_b - 1.0) >= 1e-5:
        raise ValueError(f"Vector b must be L2-normalized (got norm={norm_b:.6f})")

    return float(np.dot(a, b))

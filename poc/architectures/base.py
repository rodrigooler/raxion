from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
import time


@dataclass
class InferenceOutput:
    """Output of a single architecture inference."""
    architecture: str          # "transformer" | "ssm" | "neurosymbolic"
    query: str
    output: str
    latency_ms: float
    model_id: str
    metadata: Optional[dict] = None


class BaseArchitecture(ABC):
    """Base interface for all RAXION architecture wrappers."""

    @property
    @abstractmethod
    def architecture_type(self) -> str:
        """Returns: 'transformer' | 'ssm' | 'neurosymbolic'"""
        ...

    @property
    @abstractmethod
    def model_id(self) -> str:
        """Human-readable model identifier."""
        ...

    @abstractmethod
    def infer(self, query: str, context: Optional[str] = None) -> InferenceOutput:
        """
        Run inference on a query.

        Args:
            query: The input query string.
            context: Optional context (simulates memory retrieval).

        Returns:
            InferenceOutput with the model's response.
        """
        ...

    def timed_infer(self, query: str, context: Optional[str] = None) -> InferenceOutput:
        """Wrapper that measures latency."""
        start = time.perf_counter()
        result = self.infer(query, context)
        result.latency_ms = (time.perf_counter() - start) * 1000
        return result

    def _timed_infer(self, query: str, context: Optional[str] = None) -> InferenceOutput:
        """Backward-compatible alias for timed_infer."""
        return self.timed_infer(query, context)

from typing import Optional

from .base import BaseArchitecture, InferenceOutput
from .openrouter import chat_openrouter


SYSTEM_PROMPT_NEUROSYMBOLIC = """You are a neuro-symbolic reasoning agent.
Decompose the query into explicit premises and a conclusion.
List assumptions separately from facts.
Flag uncertainty explicitly when data is missing.
Use concise, structured reasoning.

Output format:
Premises:
- ...
Assumptions:
- ...
Reasoning:
- ...
Conclusion:
- ..."""


def _rule_extract_premises(query: str) -> str:
    """Simple rule-based extraction used as a Phase 0 neuro-symbolic stub."""
    q = query.strip().rstrip("?")
    if not q:
        return "No explicit premise provided."
    return f"Input query asks to analyze: {q}."


class NeuroSymbolicArchitecture(BaseArchitecture):
    """
    Neuro-symbolic architecture stub for Phase 0.

    This is not a full symbolic reasoner. It combines a rule-based premise
    extraction hint with an LLM response style constrained to explicit logic.
    """

    def __init__(
        self,
        model: str = "z-ai/glm-4.5-air:free",
        temperature: float = 0.1,
        provider: str = "openrouter",
    ) -> None:
        self.model = model
        self.temperature = temperature
        self.provider = provider

    @property
    def architecture_type(self) -> str:
        return "neurosymbolic"

    @property
    def model_id(self) -> str:
        return f"{self.provider}/{self.model} (neurosymbolic-stub)"

    def infer(self, query: str, context: Optional[str] = None) -> InferenceOutput:
        premise_hint = _rule_extract_premises(query)
        system_prompt = f"{SYSTEM_PROMPT_NEUROSYMBOLIC}\n\nRule-based premise hint:\n{premise_hint}"

        if self.provider == "openrouter":
            response = chat_openrouter(
                model=self.model,
                system_prompt=system_prompt,
                query=query,
                context=context,
                temperature=self.temperature,
                max_tokens=320,
                timeout_s=30.0,
            )
            return InferenceOutput(
                architecture=self.architecture_type,
                query=query,
                output=response["content"],
                latency_ms=0.0,
                model_id=self.model_id,
                metadata={
                    "provider": "openrouter",
                    "stub": True,
                    "mode": "rule-augmented-llm",
                    "usage": response.get("usage", {}),
                },
            )

        if self.provider == "ollama":
            import ollama

            if context:
                system_prompt = f"{system_prompt}\n\nContext:\n{context}"
            messages = [{"role": "system", "content": system_prompt}]
            messages.append({"role": "user", "content": query})

            response = ollama.chat(
                model=self.model,
                messages=messages,
                options={"temperature": self.temperature, "num_predict": 512},
            )

            return InferenceOutput(
                architecture=self.architecture_type,
                query=query,
                output=response["message"]["content"].strip(),
                latency_ms=0.0,
                model_id=self.model_id,
                metadata={
                    "provider": "ollama",
                    "stub": True,
                    "mode": "rule-augmented-llm",
                },
            )

        if self.provider == "mock":
            output = (
                "Premises:\n"
                f"- {premise_hint}\n"
                "Assumptions:\n"
                "- Limited information beyond the query text.\n"
                "Reasoning:\n"
                "- Build a minimal logical chain from stated premises.\n"
                "Conclusion:\n"
                f"- [mock-neurosymbolic] {query[:150]}"
            )
            return InferenceOutput(
                architecture=self.architecture_type,
                query=query,
                output=output,
                latency_ms=0.0,
                model_id=self.model_id,
                metadata={"provider": "mock", "stub": True, "mode": "rule-based"},
            )

        raise ValueError(
            f"Unsupported provider '{self.provider}'. Use 'openrouter', 'ollama', or 'mock'."
        )

from typing import Optional
from .base import BaseArchitecture, InferenceOutput
from .openrouter import chat_openrouter, check_openrouter_available


SYSTEM_PROMPT = """You are a precise reasoning agent. 
Answer the query directly and concisely. 
Do not add unnecessary preamble.
Provide factual, well-structured responses."""


class TransformerArchitecture(BaseArchitecture):
    """
    Transformer architecture wrapper using Llama 3.1 8B via Ollama.

    Characteristic biases:
    - Frequency bias: favors common/popular answers
    - Plausibility bias: generates fluent text even when uncertain
    - Framing sensitivity: output changes with question phrasing
    """

    def __init__(
        self,
        model: str = "arcee-ai/trinity-large-preview:free",
        temperature: float = 0.1,
        provider: str = "openrouter",
    ):
        self.model = model
        self.temperature = temperature
        self.provider = provider

    @property
    def architecture_type(self) -> str:
        return "transformer"

    @property
    def model_id(self) -> str:
        return f"{self.provider}/{self.model}"

    def infer(self, query: str, context: Optional[str] = None) -> InferenceOutput:
        if self.provider == "openrouter":
            response = chat_openrouter(
                model=self.model,
                system_prompt=SYSTEM_PROMPT,
                query=query,
                context=context,
                temperature=self.temperature,
                max_tokens=256,
                timeout_s=30.0,
            )
            return InferenceOutput(
                architecture=self.architecture_type,
                query=query,
                output=response["content"],
                latency_ms=0.0,  # filled by timed_infer
                model_id=self.model_id,
                metadata={
                    "provider": "openrouter",
                    "usage": response.get("usage", {}),
                },
            )

        if self.provider == "ollama":
            import ollama

            messages = []
            if context:
                messages.append(
                    {
                        "role": "system",
                        "content": f"{SYSTEM_PROMPT}\n\nContext from memory:\n{context}",
                    }
                )
            else:
                messages.append({"role": "system", "content": SYSTEM_PROMPT})

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
                latency_ms=0.0,  # filled by timed_infer
                model_id=self.model_id,
                metadata={"provider": "ollama", "tokens": response.get("eval_count", 0)},
            )

        if self.provider == "mock":
            return InferenceOutput(
                architecture=self.architecture_type,
                query=query,
                output=f"[mock-transformer] {query[:180]}",
                latency_ms=0.0,
                model_id=self.model_id,
                metadata={"provider": "mock"},
            )

        raise ValueError(
            f"Unsupported provider '{self.provider}'. Use 'openrouter', 'ollama', or 'mock'."
        )


def check_ollama_available(model: str = "llama3.1:8b") -> bool:
    """Check if Ollama is running and model is available."""
    try:
        import ollama

        models = ollama.list()
        available = [m.get("model", "") for m in models.get("models", [])]
        return any(model in available_model for available_model in available)
    except (ImportError, KeyError, TypeError):
        return False


def check_openrouter_configured() -> bool:
    """Check if OpenRouter API key is configured."""
    return check_openrouter_available()

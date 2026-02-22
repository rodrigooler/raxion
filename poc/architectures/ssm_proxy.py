from typing import Optional
from .base import BaseArchitecture, InferenceOutput
from .openrouter import chat_openrouter


# SSM architectures (like Mamba) tend to track state more linearly
# and have less plausibility bias. We simulate this tendency with a
# system prompt that emphasizes state-tracking and sequential reasoning.
SYSTEM_PROMPT_SSM = """You are a sequential reasoning agent.
Process information step by step, tracking state explicitly.
Be precise about what you know vs. what you infer.
Avoid filling gaps with plausible-sounding content - flag uncertainty explicitly."""


class SSMProxyArchitecture(BaseArchitecture):
    """
    SSM architecture proxy using Mistral 7B via Ollama.

    NOTE: This is a behavioral proxy for Phase 0 PoC only.
    Will be replaced with actual Mamba/Mamba2 in Devnet.

    Simulated SSM characteristics:
    - Sequential state tracking
    - Explicit uncertainty flagging
    - Less plausibility bias than Transformer
    """

    def __init__(
        self,
        model: str = "z-ai/glm-4.5-air:free",
        temperature: float = 0.1,
        provider: str = "openrouter",
    ):
        self.model = model
        self.temperature = temperature
        self.provider = provider

    @property
    def architecture_type(self) -> str:
        return "ssm"

    @property
    def model_id(self) -> str:
        return f"{self.provider}/{self.model} (ssm-proxy)"

    def infer(self, query: str, context: Optional[str] = None) -> InferenceOutput:
        if self.provider == "openrouter":
            response = chat_openrouter(
                model=self.model,
                system_prompt=SYSTEM_PROMPT_SSM,
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
                latency_ms=0.0,
                model_id=self.model_id,
                metadata={
                    "provider": "openrouter",
                    "proxy": True,
                    "target_arch": "mamba",
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
                        "content": f"{SYSTEM_PROMPT_SSM}\n\nContext:\n{context}",
                    }
                )
            else:
                messages.append({"role": "system", "content": SYSTEM_PROMPT_SSM})
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
                metadata={"provider": "ollama", "proxy": True, "target_arch": "mamba"},
            )

        if self.provider == "mock":
            return InferenceOutput(
                architecture=self.architecture_type,
                query=query,
                output=f"[mock-ssm] step-by-step: {query[:180]}",
                latency_ms=0.0,
                model_id=self.model_id,
                metadata={"provider": "mock", "proxy": True, "target_arch": "mamba"},
            )

        raise ValueError(
            f"Unsupported provider '{self.provider}'. Use 'openrouter', 'ollama', or 'mock'."
        )

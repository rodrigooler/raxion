import json
import os
import urllib.error
import urllib.request
from typing import Any, Optional


OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")


def check_openrouter_available() -> bool:
    """Return True when an OpenRouter API key is configured."""
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    return api_key.startswith("sk-or-")


def chat_openrouter(
    model: str,
    system_prompt: str,
    query: str,
    context: Optional[str] = None,
    temperature: float = 0.1,
    max_tokens: int = 512,
    timeout_s: float = 30.0,
) -> dict[str, Any]:
    """Call OpenRouter chat completion endpoint and return normalized fields."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not set. Export it before running inference."
        )

    system_content = system_prompt
    if context:
        system_content = f"{system_prompt}\n\nContext:\n{context}"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": query},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    req = urllib.request.Request(
        url=f"{OPENROUTER_BASE_URL}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/raxion-network/raxion",
            "X-Title": "RAXION Phase0 PoC",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenRouter HTTP {err.code}: {body}") from err
    except urllib.error.URLError as err:
        raise RuntimeError(f"OpenRouter connection error: {err}") from err

    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise RuntimeError(f"OpenRouter returned no choices: {data}")

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise RuntimeError(f"OpenRouter returned malformed choice entry: {data}")

    message = first_choice.get("message")
    if not isinstance(message, dict):
        raise RuntimeError(f"OpenRouter returned malformed message payload: {data}")

    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError(f"OpenRouter returned empty content payload: {data}")

    usage = data.get("usage", {})
    return {
        "content": content.strip(),
        "usage": usage,
        "provider": data.get("provider"),
    }

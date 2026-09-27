"""Abstract AI provider interfaces and provider implementations."""

from __future__ import annotations

import json
from typing import Any, Protocol

import httpx

from app.config import get_settings


class AIProvider(Protocol):
    """Minimal provider protocol used by the fallback orchestrator."""

    name: str

    async def generate(
        self,
        *,
        prompt: str,
        system_prompt: str | None = None,
        model: str | None = None,
        capability: str = "structured",
        response_format: str | None = None,
    ) -> str:
        """Return model output as plain text or JSON string."""


class GeminiProvider:
    """Primary provider backed by Firebase AI Logic / Gemini."""

    name = "gemini"

    async def generate(
        self,
        *,
        prompt: str,
        system_prompt: str | None = None,
        model: str | None = None,
        capability: str = "structured",
        response_format: str | None = None,
    ) -> str:
        raise NotImplementedError("Gemini generation is handled in the frontend Firebase client.")


class GroqProvider:
    """Independent backend-only Groq provider used after temporary Gemini failures."""

    name = "groq"

    def _default_model(self, capability: str) -> str:
        if capability == "research":
            return "openai/gpt-oss-20b"
        return "qwen/qwen3.8-27b"

    async def generate(
        self,
        *,
        prompt: str,
        system_prompt: str | None = None,
        model: str | None = None,
        capability: str = "structured",
        response_format: str | None = None,
    ) -> str:
        settings = get_settings()
        api_key = settings.groq_api_key
        if not api_key:
            raise RuntimeError("Groq API key is not configured on the backend.")

        selected_model = model or self._default_model(capability)
        payload: dict[str, Any] = {
            "model": selected_model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt or "Return concise, structured, evidence-aware output.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }

        if response_format == "json_schema":
            payload["response_format"] = {"type": "json_schema"}

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.status_code >= 400:
            raise RuntimeError(f"Groq request failed: {response.status_code}: {response.text}")

        body = response.json()
        choices = body.get("choices") or []
        if not choices:
            raise RuntimeError("Groq returned no choices.")

        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, list):
            text_parts: list[str] = []
            for part in content:
                if isinstance(part, dict):
                    item = part.get("text")
                    if isinstance(item, str):
                        text_parts.append(item)
            content = "\n".join(text_parts)

        if not isinstance(content, str) or not content.strip():
            raise RuntimeError("Groq returned empty content.")

        return content.strip() if response_format != "json_schema" else json.dumps(json.loads(content))


class FallbackOrchestrator:
    """Coordinates primary Gemini and secondary Groq fallback without recursion."""

    def __init__(self, primary: AIProvider | None = None, secondary: AIProvider | None = None) -> None:
        self.primary = primary or GeminiProvider()
        self.secondary = secondary or GroqProvider()

    async def generate(
        self,
        *,
        prompt: str,
        system_prompt: str | None = None,
        model: str | None = None,
        capability: str = "structured",
        response_format: str | None = None,
    ) -> str:
        try:
            return await self.primary.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                model=model,
                capability=capability,
                response_format=response_format,
            )
        except Exception:
            return await self.secondary.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                model=model,
                capability=capability,
                response_format=response_format,
            )

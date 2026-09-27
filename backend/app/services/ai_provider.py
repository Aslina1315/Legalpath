"""Abstract AI provider interfaces and provider implementations."""

from __future__ import annotations

import json
from typing import Any, Protocol

import httpx

from app.config import get_settings
from app.core.logging import get_logger

log = get_logger(__name__)


class GroqRateLimitError(Exception):
    """Raised when Groq API returns a 429 rate limit response."""
    def __init__(self, message: str, retry_after: float | None = None) -> None:
        super().__init__(message)
        self.retry_after = retry_after


class AIProvider(Protocol):
    """Minimal provider protocol used by the AI orchestrator."""

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
    """Independent backend-only Groq provider used in Groq-primary mode and secondary fallback."""

    name = "groq"

    def _default_model(self, capability: str) -> str:
        settings = get_settings()
        if capability == "research":
            return "openai/gpt-oss-20b"
        return settings.groq_model or "qwen/qwen3.8-27b"

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

        log.info("[AI] groq request started", model=selected_model, capability=capability)
        print(f"[AI] groq request started (model={selected_model}, capability={capability})")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.status_code == 429:
            retry_after_str = response.headers.get("retry-after")
            retry_after = float(retry_after_str) if retry_after_str and retry_after_str.replace(".", "").isdigit() else None
            log.warn("[AI] groq rate limited", status_code=429, retry_after=retry_after)
            print("[AI] provider=groq\n[AI] error=429\n[AI] rate_limited=true")
            raise GroqRateLimitError("Groq AI rate limit reached. Please wait a moment and retry.", retry_after=retry_after)

        if response.status_code >= 400:
            log.error("[AI] groq request failed", status_code=response.status_code, body=response.text)
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

        log.info("[AI] groq response received", model=selected_model)
        print(f"[AI] groq response received (model={selected_model})")

        # Strip markdown code fences that some Groq models wrap JSON output in
        # e.g. ```json\n{...}\n``` → {...}
        cleaned = content.strip()
        if cleaned.startswith("```"):
            # Remove opening fence (```json or ``` or ```JSON etc.)
            first_newline = cleaned.find("\n")
            if first_newline != -1:
                cleaned = cleaned[first_newline + 1:]
            # Remove closing fence
            if cleaned.rstrip().endswith("```"):
                cleaned = cleaned.rstrip()[:-3].rstrip()

        if response_format == "json_schema":
            return json.dumps(json.loads(cleaned))
        return cleaned


class FallbackOrchestrator:
    """Coordinates primary Gemini / Groq and fallback without infinite recursion."""

    def __init__(self, primary: AIProvider | None = None, secondary: AIProvider | None = None) -> None:
        settings = get_settings()
        if settings.ai_primary_provider == "groq":
            self.primary = primary or GroqProvider()
            self.secondary = secondary or (None if settings.ai_groq_only else GeminiProvider())
        else:
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
            if not self.secondary:
                raise
            return await self.secondary.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                model=model,
                capability=capability,
                response_format=response_format,
            )

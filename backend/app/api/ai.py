"""Secondary AI fallback route backed by Groq."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.config import get_settings

router = APIRouter(prefix="/ai", tags=["ai"])


class AIFallbackRequest(BaseModel):
    """Request model for a secure, backend-owned fallback generation call."""

    prompt: str = Field(min_length=1, max_length=20_000)
    system_prompt: str | None = Field(default=None, max_length=20_000)
    model: str | None = Field(default=None, min_length=1, max_length=200)
    capability: str | None = Field(default="structured", min_length=1, max_length=200)


class AIFallbackResponse(BaseModel):
    """Response returned to the frontend after a fallback attempt."""

    status: str
    message: str
    provider: str | None = None
    model: str | None = None
    code: str | None = None
    text: str | None = None


@router.post(
    "/fallback",
    response_model=AIFallbackResponse,
    summary="Secondary AI fallback",
    description="Used only after a genuine temporary Gemini provider failure. Secret is server-side only.",
)
async def secondary_ai_fallback(payload: AIFallbackRequest) -> AIFallbackResponse:
    """Attempt a single backend-sourced Groq call and fail closed if unavailable."""
    settings = get_settings()
    api_key = settings.groq_api_key

    if not api_key:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "error",
                "message": "AI service is temporarily busy. Please try again shortly.",
                "provider": "groq",
                "code": "SECONDARY_AI_UNAVAILABLE",
            },
        )

    selected_model = payload.model or ("openai/gpt-oss-20b" if payload.capability == "research" else "qwen/qwen3.8-27b")
    endpoint = "https://api.groq.com/openai/v1/chat/completions"

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                endpoint,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": selected_model,
                    "messages": [
                        {
                            "role": "system",
                            "content":
                                payload.system_prompt
                                or "You are a careful legal assistance model. Answer briefly, accurately, and avoid claiming legal certainty without evidence.",
                        },
                        {"role": "user", "content": payload.prompt},
                    ],
                    "temperature": 0.2,
                },
            )

        if response.status_code >= 400:
            raise RuntimeError(f"Groq request failed: {response.status_code}: {response.text}")

        payload_json = response.json()
        choice = payload_json.get("choices", [{}])[0]
        message = choice.get("message", {})
        content = message.get("content")
        if not isinstance(content, str) or not content.strip():
            raise RuntimeError("Groq returned empty content.")

        return AIFallbackResponse(
            status="ok",
            message="Fallback response generated successfully.",
            provider="groq",
            model=selected_model,
            text=content.strip(),
        )
    except Exception as exc:  # pragma: no cover - defensive fail-closed path
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "error",
                "message": "AI service is temporarily busy. Please try again shortly.",
                "provider": "groq",
                "code": "SECONDARY_AI_ERROR",
                "error": str(exc),
            },
        )

"""AI provider routing and generation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.config import get_settings
from app.core.logging import get_logger
from app.services.ai_provider import GroqProvider, GroqRateLimitError

log = get_logger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


class AIConfigRequest(BaseModel):
    """Configuration query."""
    pass


class AIConfigResponse(BaseModel):
    """Public backend AI configuration."""

    status: str
    primary_provider: str
    groq_only: bool
    model: str
    has_groq_key: bool


class AIGenerateRequest(BaseModel):
    """Request model for backend AI generation call."""

    prompt: str = Field(min_length=1, max_length=25_000)
    system_prompt: str | None = Field(default=None, max_length=20_000)
    model: str | None = Field(default=None, min_length=1, max_length=200)
    capability: str | None = Field(default="structured", min_length=1, max_length=200)


class AIGenerateResponse(BaseModel):
    """Response returned to the frontend after an AI generation attempt."""

    status: str
    message: str
    provider: str | None = None
    model: str | None = None
    code: str | None = None
    text: str | None = None
    rate_limited: bool | None = None
    retry_after: float | None = None


@router.get(
    "/config",
    response_model=AIConfigResponse,
    summary="Get backend AI provider configuration",
    description="Returns the active primary AI provider (gemini or groq), demo flags, and default model.",
)
async def get_ai_config() -> AIConfigResponse:
    """Return the active AI configuration."""
    settings = get_settings()
    return AIConfigResponse(
        status="ok",
        primary_provider=settings.ai_primary_provider,
        groq_only=settings.ai_groq_only,
        model=settings.groq_model,
        has_groq_key=bool(settings.groq_api_key),
    )


@router.post(
    "/generate",
    response_model=AIGenerateResponse,
    summary="Primary/Direct backend AI generation",
    description="Generates AI output using the configured backend provider (Groq in Groq-primary mode).",
)
@router.post(
    "/fallback",
    response_model=AIGenerateResponse,
    summary="Secondary AI fallback",
    description="Backend-sourced Groq fallback call.",
)
async def generate_ai(payload: AIGenerateRequest) -> AIGenerateResponse:
    """Execute AI generation on backend using Groq."""
    settings = get_settings()
    api_key = settings.groq_api_key

    log.info("[AI] request received", primary=settings.ai_primary_provider, groq_only=settings.ai_groq_only)
    print(f"[AI] primary={settings.ai_primary_provider}")

    if not api_key:
        log.warn("[AI] groq api key not configured")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "error",
                "message": "AI service is temporarily busy. Please try again shortly.",
                "provider": "groq",
                "code": "SECONDARY_AI_UNAVAILABLE",
            },
        )

    provider = GroqProvider()
    selected_model = payload.model or (
        "openai/gpt-oss-20b" if payload.capability == "research" else settings.groq_model
    )

    try:
        content = await provider.generate(
            prompt=payload.prompt,
            system_prompt=payload.system_prompt,
            model=selected_model,
            capability=payload.capability or "structured",
        )

        return AIGenerateResponse(
            status="ok",
            message="Response generated successfully.",
            provider="groq",
            model=selected_model,
            text=content,
        )
    except GroqRateLimitError as rate_err:
        log.warn("[AI] groq rate limited", error=str(rate_err), retry_after=rate_err.retry_after)
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "status": "error",
                "message": "Groq AI rate limit reached. Please wait a moment and retry.",
                "provider": "groq",
                "code": "GROQ_RATE_LIMITED",
                "rate_limited": True,
                "retry_after": rate_err.retry_after,
            },
        )
    except Exception as exc:
        log.error("[AI] generation error", error=str(exc))
        print(f"[AI] provider=groq\n[AI] error={exc}")
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

"""
Application configuration.
All values come from environment variables — no secrets hardcoded here.
In development, create backend/.env and populate from .env.example.
"""

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Service
    service_name: str = "legal-ai-backend"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Request limits
    max_request_size_bytes: int = 1 * 1024 * 1024  # 1 MB default

    # Rate limiting
    rate_limit_per_minute: int = 60

    # AI Provider routing (gemini or groq)
    ai_primary_provider: Literal["gemini", "groq"] = "groq"
    ai_groq_only: bool = False
    groq_model: str = "qwen/qwen3.8-27b"

    # Secondary / Primary Groq API Key (server-side only)
    groq_api_key: str | None = None

    # Future: Firebase Admin SDK credentials path
    # google_application_credentials: str | None = None

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v: object) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return list(v)  # type: ignore[arg-type]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()

"""Server-side Gemini configuration helpers.

This backend remains intentionally passive. The active production pipeline is the browser-based
Firebase AI Logic path, so this module only validates that a server-side Gemini configuration is
available when future backend-driven orchestration is enabled.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


class GeminiConfigurationError(RuntimeError):
    """Raised when a future backend Gemini configuration is missing."""


@dataclass(frozen=True)
class GeminiClientConfig:
    """Configuration payload for a future server-side Gemini client."""

    api_key: str
    model: str = "gemini-2.5-flash"
    backend: str = "google-generative-ai"


def get_gemini_client() -> GeminiClientConfig:
    """Return a typed Gemini config only when the server is explicitly configured."""
    api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
    if not api_key or api_key.lower().startswith("replace_") or api_key.lower().startswith("your_"):
        raise GeminiConfigurationError(
            "Server-side Gemini is not configured. The deployed product currently uses Firebase AI Logic in the browser."
        )

    return GeminiClientConfig(api_key=api_key)

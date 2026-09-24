"""
Base response schemas shared across all API endpoints.
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    """Generic success response wrapper."""

    model_config = ConfigDict(frozen=True)

    status: str = "ok"
    data: T


class ErrorResponse(BaseModel):
    """Structured error response."""

    model_config = ConfigDict(frozen=True)

    status: str = "error"
    code: str
    message: str
    details: dict[str, Any] | None = None


class HealthResponse(BaseModel):
    """Health check response."""

    model_config = ConfigDict(frozen=True)

    status: str
    service: str

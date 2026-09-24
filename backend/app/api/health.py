"""
Health check endpoint.
"""

from fastapi import APIRouter

from app.schemas.base import HealthResponse
from app.config import get_settings

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health check",
    description="Returns service status. Used by load balancers and monitoring.",
)
async def health_check() -> HealthResponse:
    """Returns ok when the service is running."""
    settings = get_settings()
    return HealthResponse(status="ok", service=settings.service_name)

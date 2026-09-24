"""
Security middleware and CORS configuration.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import Settings


def configure_cors(app: FastAPI, settings: Settings) -> None:
    """Add CORS middleware with settings-driven allowed origins."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
    )


def configure_request_size_limit(app: FastAPI, settings: Settings) -> None:
    """
    Middleware to reject requests exceeding the configured size limit.
    This is a guard against large payload attacks.
    """
    @app.middleware("http")
    async def request_size_guard(request: Request, call_next: object) -> JSONResponse:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.max_request_size_bytes:
            return JSONResponse(
                status_code=413,
                content={"error": "Request too large", "code": "PAYLOAD_TOO_LARGE"},
            )
        call_next_fn = call_next  # type: ignore[assignment]
        return await call_next_fn(request)  # type: ignore[return-value]

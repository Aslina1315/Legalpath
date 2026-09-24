"""
FastAPI application factory.
Configures middleware, routes, and startup behavior.
"""

import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.router import api_router
from app.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.core.security import configure_cors, configure_request_size_limit

log = get_logger(__name__)

# Rate limiter — uses client IP by default
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler — startup and shutdown."""
    settings = get_settings()
    log.info("service_startup", service=settings.service_name, env=settings.environment)
    yield
    log.info("service_shutdown", service=settings.service_name)


def create_app() -> FastAPI:
    """Application factory."""
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="Legal AI Backend",
        description="PromptWars Trusted Legal Access Platform — backend service.",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.environment == "development" else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.environment == "development" else None,
    )

    # Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

    # CORS
    configure_cors(app, settings)

    # Request size guard
    configure_request_size_limit(app, settings)

    # Request timing
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next: object) -> object:
        start = time.perf_counter()
        call_next_fn = call_next  # type: ignore[assignment]
        response = await call_next_fn(request)  # type: ignore[return-value]
        elapsed = time.perf_counter() - start
        response.headers["X-Process-Time"] = f"{elapsed:.4f}"  # type: ignore[union-attr]
        return response

    # Routers
    app.include_router(api_router)

    return app


app = create_app()

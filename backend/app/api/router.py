"""
Central API router — aggregates all sub-routers.
"""

from fastapi import APIRouter

from app.api import health

api_router = APIRouter()
api_router.include_router(health.router)

"""
Test configuration and shared fixtures.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client() -> TestClient:
    """Shared test client for all tests."""
    return TestClient(app)

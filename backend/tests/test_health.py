"""
Health endpoint tests — REAL tests against the actual endpoint.
"""

from fastapi.testclient import TestClient


def test_health_returns_200(client: TestClient) -> None:
    """GET /health must return HTTP 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_returns_correct_json(client: TestClient) -> None:
    """GET /health must return the exact expected JSON structure."""
    response = client.get("/health")
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "legal-ai-backend"


def test_health_content_type_is_json(client: TestClient) -> None:
    """GET /health response must be JSON content type."""
    response = client.get("/health")
    assert "application/json" in response.headers["content-type"]

"""Tests for the secure backend AI routes."""

from fastapi.testclient import TestClient


def test_ai_config_route(client: TestClient) -> None:
    """The backend config route must report the active primary provider and model."""
    response = client.get("/ai/config")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "primary_provider" in data
    assert "groq_only" in data
    assert "model" in data


def test_secondary_ai_fallback_route_exists(client: TestClient) -> None:
    """The backend fallback route must be present and reject missing configuration safely."""
    response = client.post(
        "/ai/fallback",
        json={"prompt": "Please summarize the legal issue in one sentence."},
    )

    assert response.status_code in {200, 429, 503}
    data = response.json()
    assert "status" in data
    assert "message" in data

    if response.status_code == 200:
        assert data["status"] == "ok"
        assert data["provider"] == "groq"
    elif response.status_code == 429:
        assert data["code"] == "GROQ_RATE_LIMITED"
    else:
        assert data["code"] in {"SECONDARY_AI_UNAVAILABLE", "SECONDARY_AI_ERROR"}


def test_ai_generate_route(client: TestClient) -> None:
    """The backend generate route must accept requests."""
    response = client.post(
        "/ai/generate",
        json={"prompt": "Return JSON: {\"summary\": \"test\"}"},
    )
    assert response.status_code in {200, 429, 503}

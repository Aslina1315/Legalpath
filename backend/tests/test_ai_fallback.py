"""Tests for the secure backend fallback route."""

from fastapi.testclient import TestClient


def test_secondary_ai_fallback_route_exists(client: TestClient) -> None:
    """The backend fallback route must be present and reject missing configuration safely."""
    response = client.post(
        "/ai/fallback",
        json={"prompt": "Please summarize the legal issue in one sentence."},
    )

    assert response.status_code in {200, 503}
    data = response.json()
    assert "status" in data
    assert "message" in data

    if response.status_code == 200:
        assert data["status"] == "ok"
        assert data["provider"] == "groq"
    else:
        assert data["code"] in {"SECONDARY_AI_UNAVAILABLE", "SECONDARY_AI_ERROR"}
        assert "temporarily busy" in data["message"].lower()

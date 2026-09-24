"""
API validation tests.
Verifies that malformed requests get structured error responses.
"""

from fastapi.testclient import TestClient


def test_nonexistent_route_returns_404(client: TestClient) -> None:
    """Requests to non-existent routes return 404."""
    response = client.get("/nonexistent")
    assert response.status_code == 404


def test_method_not_allowed(client: TestClient) -> None:
    """POST to GET-only /health returns 405."""
    response = client.post("/health")
    assert response.status_code == 405


def test_health_does_not_accept_unknown_path(client: TestClient) -> None:
    """Undefined sub-paths of /health return 404."""
    response = client.get("/health/extra")
    assert response.status_code == 404

"""Tests for rate limiting on authentication endpoints."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client_with_real_limiter() -> TestClient:
    """TestClient where the rate limiter is active but DB is mocked."""
    from app.api.deps.db import get_db
    from app.main import create_application

    mock_db = MagicMock()
    app = create_application()
    app.dependency_overrides[get_db] = lambda: mock_db
    # raise_server_exceptions=False so 429 is returned rather than raised
    return TestClient(app, raise_server_exceptions=False)


def test_register_rate_limit(client_with_real_limiter: TestClient) -> None:
    """More than 3 register attempts per minute from the same IP must return 429."""
    payload = {"email": "ratelimit@example.com", "password": "secret123", "role": "jobseeker"}

    with patch("app.api.routes.auth.get_user_by_email", return_value=None):
        responses = [
            client_with_real_limiter.post("/api/v1/auth/register", json=payload)
            for _ in range(4)
        ]

    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes, (
        f"Expected at least one 429 after 4 rapid register attempts, got: {status_codes}"
    )

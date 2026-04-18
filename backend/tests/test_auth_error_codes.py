"""Tests for auth route error codes.

Verifies that:
- Registering with a duplicate email returns HTTP 409
- Logging in with a wrong password returns HTTP 401

These contracts are relied on by the frontend auth-form.tsx error classification.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client() -> TestClient:
    """Create a TestClient with the DB dependency overridden by a mock session."""
    from app.api.deps.db import get_db
    from app.main import create_application

    mock_db = MagicMock()
    app = create_application()
    app.dependency_overrides[get_db] = lambda: mock_db
    return TestClient(app, raise_server_exceptions=False)


def test_register_duplicate_email_returns_409(client: TestClient) -> None:
    """Duplicate email on /register must return 409 CONFLICT."""
    existing_user = MagicMock()

    with patch("app.api.routes.auth.get_user_by_email", return_value=existing_user):
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "user@example.com", "password": "secret123", "role": "jobseeker"},
        )

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_login_wrong_password_returns_401(client: TestClient) -> None:
    """Wrong password on /login must return 401 UNAUTHORIZED."""
    with patch("app.api.routes.auth.authenticate_user", return_value=None):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "user@example.com", "password": "wrongpassword"},
        )

    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]
    # Critical: the detail must NOT contain the word "already" or "taken"
    # so the frontend does not misclassify this as an email-taken error.
    detail = response.json()["detail"]
    assert "already exists" not in detail
    assert "taken" not in detail.lower()

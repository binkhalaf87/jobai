"""Integration tests for authentication endpoints."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


def _make_user(role: str = "jobseeker") -> MagicMock:
    user = MagicMock()
    user.id = "user-id-123"
    user.email = "test@example.com"
    user.full_name = "Test User"
    user.is_active = True
    user.role = role
    user.created_at = "2024-01-01T00:00:00Z"
    user.updated_at = "2024-01-01T00:00:00Z"
    user.last_login_at = None
    return user


def _make_auth_response(user: MagicMock) -> dict:
    return {
        "access_token": "test.access.token",
        "refresh_token": "test-refresh-token",
        "token_type": "bearer",
        "user": user,
    }


def test_register_new_user(client: TestClient) -> None:
    """New user registration must return 201 with an access_token."""
    user = _make_user()

    with (
        patch("app.api.routes.auth.get_user_by_email", return_value=None),
        patch("app.api.routes.auth.create_user", return_value=user),
        patch("app.api.routes.auth.build_auth_response", return_value=_make_auth_response(user)),
    ):
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "new@example.com", "password": "secret123", "role": "jobseeker"},
        )

    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_email(client: TestClient) -> None:
    """Registering with an existing email must return 409 CONFLICT."""
    existing_user = MagicMock()

    with patch("app.api.routes.auth.get_user_by_email", return_value=existing_user):
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "taken@example.com", "password": "secret123", "role": "jobseeker"},
        )

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_login_valid_credentials(client: TestClient) -> None:
    """Valid credentials must return 200 with a bearer token."""
    user = _make_user()

    with (
        patch("app.api.routes.auth.authenticate_user", return_value=user),
        patch("app.api.routes.auth.build_auth_response", return_value=_make_auth_response(user)),
    ):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "correct"},
        )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_login_wrong_password(client: TestClient) -> None:
    """Wrong password must return 401 UNAUTHORIZED, not a 409 or other status."""
    with patch("app.api.routes.auth.authenticate_user", return_value=None):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"},
        )

    assert response.status_code == 401
    detail = response.json()["detail"]
    assert "already exists" not in detail
    assert "taken" not in detail.lower()


def test_me_endpoint_authenticated(client: TestClient, mock_db: MagicMock) -> None:
    """GET /auth/me with a valid token must return the user's data."""
    user = _make_user()
    mock_db.get.return_value = user

    with patch("app.api.deps.auth.decode_access_token", return_value={"sub": user.id, "type": "access"}):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer test.access.token"},
        )

    assert response.status_code == 200
    assert response.json()["email"] == user.email


def test_me_endpoint_unauthenticated(client: TestClient) -> None:
    """GET /auth/me without a token must return 401 or 403."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)

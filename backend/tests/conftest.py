"""Shared test fixtures for the JobAI test suite."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def mock_db() -> MagicMock:
    """Return a mock SQLAlchemy Session."""
    return MagicMock()


@pytest.fixture()
def client(mock_db: MagicMock) -> TestClient:
    """TestClient with the DB dependency replaced by a mock session."""
    from app.api.deps.db import get_db
    from app.main import create_application

    app = create_application()
    app.dependency_overrides[get_db] = lambda: mock_db
    return TestClient(app, raise_server_exceptions=False)

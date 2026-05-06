"""Tests for Paymob webhook idempotency."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.services.paymob_webhook_service import PaymobWebhookProcessResult


def _make_client() -> TestClient:
    from app.api.deps.db import get_db
    from app.main import create_application

    mock_db = MagicMock()
    app = create_application()
    app.dependency_overrides[get_db] = lambda: mock_db
    return TestClient(app, raise_server_exceptions=False)


_WEBHOOK_PAYLOAD = {
    "type": "TRANSACTION",
    "obj": {
        "id": 123456,
        "order": {"id": 999, "merchant_order_id": "order-abc"},
        "success": True,
        "pending": False,
        "amount_cents": 10000,
        "currency": "EGP",
        "error_occured": False,
        "is_3d_secure": False,
        "is_auth": False,
        "is_capture": False,
        "is_standalone_payment": True,
        "is_voided": False,
        "is_refunded": False,
        "is_void": False,
        "is_refund": False,
        "owner": 1,
        "created_at": "2024-01-01T00:00:00Z",
    },
}


def test_duplicate_webhook_returns_duplicate_true() -> None:
    """Sending the same webhook twice must return duplicate=True on the second call."""
    client = _make_client()

    first_result = PaymobWebhookProcessResult(
        event_id="evt-001",
        payment_order_id="order-abc",
        status="processed",
        duplicate=False,
    )
    second_result = PaymobWebhookProcessResult(
        event_id="evt-001",
        payment_order_id="order-abc",
        status="processed",
        duplicate=True,
    )

    with patch(
        "app.api.routes.billing.process_paymob_webhook",
        side_effect=[first_result, second_result],
    ):
        first_response = client.post(
            "/api/v1/billing/paymob/webhook?hmac=valid",
            json=_WEBHOOK_PAYLOAD,
        )
        second_response = client.post(
            "/api/v1/billing/paymob/webhook?hmac=valid",
            json=_WEBHOOK_PAYLOAD,
        )

    assert first_response.status_code == 200
    assert first_response.json()["duplicate"] is False

    assert second_response.status_code == 200
    assert second_response.json()["duplicate"] is True

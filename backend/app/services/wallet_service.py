from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import WalletTransactionDirection, WalletTransactionStatus, WalletTransactionType
from app.models.user_wallet import UserWallet
from app.models.wallet_transaction import WalletTransaction


class InsufficientPointsError(Exception):
    """Raised when the user's wallet does not have enough points for a feature."""


def deduct_points(db: Session, user_id: str, points: int, feature_name: str) -> WalletTransaction:
    """Deduct points from the user's wallet and record a USAGE_DEBIT transaction.

    Raises InsufficientPointsError when balance is too low or wallet is missing.
    The caller is responsible for committing the session.
    """
    wallet = db.scalar(
        select(UserWallet)
        .where(UserWallet.user_id == user_id)
        .with_for_update()
    )
    if not wallet or not wallet.is_active:
        raise InsufficientPointsError("No active wallet found. Purchase a points pack to continue.")
    if wallet.balance_points < points:
        raise InsufficientPointsError(
            f"Insufficient points. Required: {points}, available: {wallet.balance_points}."
        )

    balance_before = wallet.balance_points
    balance_after = balance_before - points
    wallet.balance_points = balance_after
    wallet.lifetime_spent_points += points

    txn = WalletTransaction(
        wallet_id=wallet.id,
        user_id=user_id,
        transaction_type=WalletTransactionType.USAGE_DEBIT,
        status=WalletTransactionStatus.POSTED,
        direction=WalletTransactionDirection.DEBIT,
        points=points,
        balance_before=balance_before,
        balance_after=balance_after,
        description=f"Feature use: {feature_name}",
        effective_at=datetime.now(timezone.utc),
    )
    db.add(txn)
    return txn

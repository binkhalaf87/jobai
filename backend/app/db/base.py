from app.db.base_class import Base
from app.models.ai_report import AIAnalysisReport
from app.models.analysis import Analysis
from app.models.job_description import JobDescription
from app.models.payment_order import PaymentOrder
from app.models.payment_webhook_event import PaymentWebhookEvent
from app.models.plan import Plan
from app.models.resume import Resume
from app.models.rewrite_suggestion import RewriteSuggestion
from app.models.subscription import Subscription
from app.models.usage_log import UsageLog
from app.models.user_wallet import UserWallet
from app.models.user import User
from app.models.wallet_transaction import WalletTransaction

# Importing models here registers them with SQLAlchemy metadata for Alembic migrations.

__all__ = [
    "AIAnalysisReport",
    "Analysis",
    "Base",
    "JobDescription",
    "PaymentOrder",
    "PaymentWebhookEvent",
    "Plan",
    "Resume",
    "RewriteSuggestion",
    "Subscription",
    "UsageLog",
    "User",
    "UserWallet",
    "WalletTransaction",
]

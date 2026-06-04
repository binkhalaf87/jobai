from app.db.base_class import Base
from app.models.ai_report import AIAnalysisReport
from app.models.analysis import Analysis
from app.models.email_campaign import EmailCampaign
from app.models.email_campaign_contact import EmailCampaignContact
from app.models.gmail_connection import GmailConnection
from app.models.gmail_connection_request import GmailConnectionRequest
from app.models.interview import InterviewSession
from app.models.interview_response import InterviewResponse
from app.models.job_description import JobDescription
from app.models.mailing_list import Recipient, RecipientList
from app.models.payment_order import PaymentOrder
from app.models.payment_webhook_event import PaymentWebhookEvent
from app.models.plan import Plan
from app.models.recruiter_interview import RecruiterInterview
from app.models.refresh_token import RefreshToken
from app.models.resume import Resume
from app.models.rewrite_suggestion import RewriteSuggestion
from app.models.promo_code import PromoCode
from app.models.promo_code_usage import PromoCodeUsage
from app.models.saved_job import SavedJob
from app.models.send_history import SendHistory
from app.models.smart_send import SendCampaign, SendLog
from app.models.smart_send_letter_cache import SmartSendLetterCache
from app.models.smtp_connection import SmtpConnection
from app.models.subscription import Subscription
from app.models.support_ticket import SupportTicket, TicketMessage
from app.models.usage_log import UsageLog
from app.models.user_feature_credit import UserFeatureCredit
from app.models.user_wallet import UserWallet
from app.models.user import User
from app.models.wallet_transaction import WalletTransaction

# Importing models here registers them with SQLAlchemy metadata for Alembic migrations.

__all__ = [
    "AIAnalysisReport",
    "Analysis",
    "Base",
    "EmailCampaign",
    "EmailCampaignContact",
    "GmailConnection",
    "GmailConnectionRequest",
    "InterviewResponse",
    "InterviewSession",
    "JobDescription",
    "PaymentOrder",
    "PaymentWebhookEvent",
    "Plan",
    "Recipient",
    "RecipientList",
    "RecruiterInterview",
    "RefreshToken",
    "Resume",
    "RewriteSuggestion",
    "PromoCode",
    "PromoCodeUsage",
    "SavedJob",
    "SendCampaign",
    "SendHistory",
    "SendLog",
    "SmartSendLetterCache",
    "SmtpConnection",
    "Subscription",
    "SupportTicket",
    "TicketMessage",
    "UsageLog",
    "User",
    "UserFeatureCredit",
    "UserWallet",
    "WalletTransaction",
]

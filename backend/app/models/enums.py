from enum import Enum


class ResumeProcessingStatus(str, Enum):
    """Lifecycle states for resume ingestion and parsing."""

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PARSED = "parsed"
    FAILED = "failed"


class EmploymentType(str, Enum):
    """Basic employment types associated with a job description."""

    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    TEMPORARY = "temporary"


class AnalysisStatus(str, Enum):
    """Execution states for a resume analysis workflow."""

    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class SuggestionSection(str, Enum):
    """Resume sections that rewrite suggestions can target."""

    SUMMARY = "summary"
    EXPERIENCE = "experience"
    SKILLS = "skills"
    EDUCATION = "education"
    GENERAL = "general"


class SubscriptionStatus(str, Enum):
    """Subscription lifecycle states for billing."""

    PENDING_ACTIVATION = "pending_activation"
    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    EXPIRED = "expired"


class UsageEventType(str, Enum):
    """Tracked application events for metering and auditing."""

    ANALYSIS_REQUESTED = "analysis_requested"
    ANALYSIS_COMPLETED = "analysis_completed"
    REWRITE_GENERATED = "rewrite_generated"
    AUTH_LOGIN = "auth_login"
    AUTH_REGISTER = "auth_register"
    AUTH_LOGOUT = "auth_logout"
    AUTH_TOKEN_REFRESH = "auth_token_refresh"
    SMTP_CONNECTED = "smtp_connected"
    SMTP_DELETED = "smtp_deleted"
    FILE_DELETED = "file_deleted"
    ADMIN_USER_UPDATED = "admin_user_updated"
    ADMIN_WALLET_ADJUSTED = "admin_wallet_adjusted"
    AUTH_EMAIL_VERIFIED = "auth_email_verified"
    AUTH_EMAIL_VERIFICATION_RESENT = "auth_email_verification_resent"
    AUTH_PASSWORD_RESET_REQUESTED = "auth_password_reset_requested"
    AUTH_PASSWORD_RESET_COMPLETED = "auth_password_reset_completed"
    RESUME_UPLOADED = "resume_uploaded"
    RESUME_DELETED = "resume_deleted"
    BILLING_CHECKOUT_INITIATED = "billing_checkout_initiated"
    BILLING_PAYMENT_CONFIRMED = "billing_payment_confirmed"
    ADMIN_PROMO_CREATED = "admin_promo_created"
    ADMIN_PROMO_DELETED = "admin_promo_deleted"
    ADMIN_PAYMENT_ACTIVATED = "admin_payment_activated"
    BILLING_PROMO_APPLIED = "billing_promo_applied"
    PAGE_VIEW = "page_view"
    TICKET_CREATED = "ticket_created"
    TICKET_MESSAGE_SENT = "ticket_message_sent"
    TICKET_STATUS_UPDATED = "ticket_status_updated"


class UserRole(str, Enum):
    """User role determining access level and feature set."""

    JOBSEEKER = "jobseeker"
    RECRUITER = "recruiter"
    ADMIN = "admin"


class CandidateStage(str, Enum):
    """Hiring pipeline stage set by a recruiter for a candidate resume."""

    NEW = "new"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    REJECTED = "rejected"


class PlanAudience(str, Enum):
    """Audience segment supported by a billing plan."""

    JOBSEEKER = "jobseeker"
    RECRUITER = "recruiter"


class PlanKind(str, Enum):
    """Commercial plan shape stored in the catalog."""

    SUBSCRIPTION = "subscription"
    POINTS_PACK = "points_pack"


class BillingInterval(str, Enum):
    """Billing interval applied to a plan."""

    MONTHLY = "monthly"
    ONE_TIME = "one_time"


class PaymentOrderType(str, Enum):
    """Business purpose of a payment order."""

    SUBSCRIPTION_INITIAL = "subscription_initial"
    SUBSCRIPTION_RENEWAL = "subscription_renewal"
    POINTS_PURCHASE = "points_purchase"


class PaymentOrderStatus(str, Enum):
    """Lifecycle state of a provider-backed payment order."""

    PENDING = "pending"
    PAYMENT_KEY_ISSUED = "payment_key_issued"
    PAID = "paid"
    FAILED = "failed"
    CANCELED = "canceled"
    EXPIRED = "expired"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentWebhookEventStatus(str, Enum):
    """Processing state for a persisted payment webhook event."""

    RECEIVED = "received"
    PROCESSED = "processed"
    IGNORED = "ignored"
    FAILED = "failed"


class WalletTransactionType(str, Enum):
    """Ledger transaction type for user wallet movements."""

    SUBSCRIPTION_GRANT = "subscription_grant"
    POINTS_PURCHASE = "points_purchase"
    USAGE_DEBIT = "usage_debit"
    REFUND_CREDIT = "refund_credit"
    ADJUSTMENT = "adjustment"


class WalletTransactionStatus(str, Enum):
    """Posting status for a wallet transaction."""

    POSTED = "posted"
    REVERSED = "reversed"


class WalletTransactionDirection(str, Enum):
    """Whether wallet points are added or removed."""

    CREDIT = "credit"
    DEBIT = "debit"


class PromoDiscountType(str, Enum):
    """Discount calculation method for a promo code."""

    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"


class PromoApplicableTo(str, Enum):
    """Which user segment a promo code can be applied by."""

    ALL = "all"
    JOBSEEKER = "jobseeker"
    RECRUITER = "recruiter"


class TicketCategory(str, Enum):
    """Category of a support ticket submitted by a user."""

    TECHNICAL = "technical"
    INQUIRY = "inquiry"
    BILLING = "billing"
    FEATURE_REQUEST = "feature_request"


class TicketStatus(str, Enum):
    """Lifecycle status of a support ticket."""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class SaudizationProcessingStatus(str, Enum):
    """Processing lifecycle for saudization PDF decisions and GOSI Excel reports."""

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    EXTRACTED = "extracted"
    FAILED = "failed"


class SaudizationAIStatus(str, Enum):
    """AI recommendation generation status for a saudization analysis."""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

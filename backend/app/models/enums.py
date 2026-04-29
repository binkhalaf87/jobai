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

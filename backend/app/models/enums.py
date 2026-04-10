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

    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"


class UsageEventType(str, Enum):
    """Tracked application events for metering and auditing."""

    ANALYSIS_REQUESTED = "analysis_requested"
    ANALYSIS_COMPLETED = "analysis_completed"
    REWRITE_GENERATED = "rewrite_generated"
    AUTH_LOGIN = "auth_login"


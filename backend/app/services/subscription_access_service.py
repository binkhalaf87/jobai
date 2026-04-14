"""Centralized subscription, entitlement, and plan-limit resolution."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import PlanAudience, PlanKind, SubscriptionStatus, UserRole
from app.models.job_description import JobDescription
from app.models.plan import Plan
from app.models.resume import Resume
from app.models.subscription import Subscription
from app.models.user import User
from app.services.billing_service import get_current_subscription

RECRUITER_DASHBOARD_FEATURE = "recruiter_dashboard"
RECRUITER_JOBS_FEATURE = "recruiter_jobs"
RECRUITER_CANDIDATES_FEATURE = "recruiter_candidates"
RECRUITER_AI_ANALYSIS_FEATURE = "recruiter_ai_candidate_analysis"

JOBSEEKER_RESUME_ANALYSIS_FEATURE = "jobseeker_resume_analysis"
JOBSEEKER_REWRITE_FEATURE = "jobseeker_resume_rewrite"
JOBSEEKER_AI_REPORT_FEATURE = "jobseeker_ai_report"
JOBSEEKER_MOCK_INTERVIEW_FEATURE = "jobseeker_mock_interview"
JOBSEEKER_SMART_SEND_FEATURE = "jobseeker_smart_send"

LIMIT_MAX_JOBS = "max_jobs"
LIMIT_MAX_CANDIDATES = "max_candidates"

ACTIVE_ACCESS_STATUSES = {
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIALING,
}


class SubscriptionRequiredError(RuntimeError):
    """Raised when a premium action requires an active subscription."""


class FeatureEntitlementError(RuntimeError):
    """Raised when the user's current plan does not include a requested feature."""


class PlanLimitExceededError(RuntimeError):
    """Raised when a plan-specific usage or storage limit is exceeded."""


@dataclass(frozen=True)
class PlanEntitlements:
    """Resolved feature and limit rules for a commercial plan."""

    features: frozenset[str]
    limits: dict[str, int | None]
    points_costs: dict[str, int]


@dataclass(frozen=True)
class SubscriptionAccessSnapshot:
    """Centralized view of a user's current subscription access state."""

    user: User
    subscription: Subscription | None
    plan: Plan | None
    entitlements: PlanEntitlements
    has_active_subscription: bool


DEFAULT_PLAN_ENTITLEMENTS: dict[str, PlanEntitlements] = {
    "recruiter_starter_monthly": PlanEntitlements(
        features=frozenset(
            {
                RECRUITER_DASHBOARD_FEATURE,
                RECRUITER_JOBS_FEATURE,
                RECRUITER_CANDIDATES_FEATURE,
                RECRUITER_AI_ANALYSIS_FEATURE,
            }
        ),
        limits={
            LIMIT_MAX_JOBS: 3,
            LIMIT_MAX_CANDIDATES: 50,
        },
        points_costs={},
    ),
    "recruiter_growth_monthly": PlanEntitlements(
        features=frozenset(
            {
                RECRUITER_DASHBOARD_FEATURE,
                RECRUITER_JOBS_FEATURE,
                RECRUITER_CANDIDATES_FEATURE,
                RECRUITER_AI_ANALYSIS_FEATURE,
            }
        ),
        limits={
            LIMIT_MAX_JOBS: 10,
            LIMIT_MAX_CANDIDATES: 250,
        },
        points_costs={},
    ),
    "recruiter_scale_monthly": PlanEntitlements(
        features=frozenset(
            {
                RECRUITER_DASHBOARD_FEATURE,
                RECRUITER_JOBS_FEATURE,
                RECRUITER_CANDIDATES_FEATURE,
                RECRUITER_AI_ANALYSIS_FEATURE,
            }
        ),
        limits={
            LIMIT_MAX_JOBS: None,
            LIMIT_MAX_CANDIDATES: None,
        },
        points_costs={},
    ),
    "jobseeker_monthly_29_sar": PlanEntitlements(
        features=frozenset(
            {
                JOBSEEKER_RESUME_ANALYSIS_FEATURE,
                JOBSEEKER_REWRITE_FEATURE,
                JOBSEEKER_AI_REPORT_FEATURE,
                JOBSEEKER_MOCK_INTERVIEW_FEATURE,
                JOBSEEKER_SMART_SEND_FEATURE,
            }
        ),
        limits={},
        points_costs={
            JOBSEEKER_REWRITE_FEATURE: 1,
            JOBSEEKER_AI_REPORT_FEATURE: 3,
            JOBSEEKER_MOCK_INTERVIEW_FEATURE: 5,
            JOBSEEKER_SMART_SEND_FEATURE: 2,
        },
    ),
}

DEFAULT_RECRUITER_FEATURES = frozenset(
    {
        RECRUITER_DASHBOARD_FEATURE,
        RECRUITER_JOBS_FEATURE,
        RECRUITER_CANDIDATES_FEATURE,
        RECRUITER_AI_ANALYSIS_FEATURE,
    }
)

DEFAULT_JOBSEEKER_FEATURES = frozenset(
    {
        JOBSEEKER_RESUME_ANALYSIS_FEATURE,
        JOBSEEKER_REWRITE_FEATURE,
        JOBSEEKER_AI_REPORT_FEATURE,
        JOBSEEKER_MOCK_INTERVIEW_FEATURE,
        JOBSEEKER_SMART_SEND_FEATURE,
    }
)

DEFAULT_JOBSEEKER_POINTS_COSTS = {
    JOBSEEKER_REWRITE_FEATURE: 1,
    JOBSEEKER_AI_REPORT_FEATURE: 3,
    JOBSEEKER_MOCK_INTERVIEW_FEATURE: 5,
    JOBSEEKER_SMART_SEND_FEATURE: 2,
}


def is_subscription_active(subscription: Subscription | None) -> bool:
    """Return whether the subscription grants paid feature access."""
    return bool(subscription and subscription.status in ACTIVE_ACCESS_STATUSES)


def _coerce_string_set(values: Any) -> frozenset[str]:
    if not isinstance(values, list):
        return frozenset()
    return frozenset(str(value).strip() for value in values if str(value).strip())


def _coerce_limit_mapping(values: Any) -> dict[str, int | None]:
    if not isinstance(values, dict):
        return {}

    coerced: dict[str, int | None] = {}
    for key, raw_value in values.items():
        if raw_value is None:
            coerced[str(key)] = None
            continue
        try:
            coerced[str(key)] = int(raw_value)
        except (TypeError, ValueError):
            continue
    return coerced


def _coerce_points_cost_mapping(values: Any) -> dict[str, int]:
    if not isinstance(values, dict):
        return {}

    coerced: dict[str, int] = {}
    for key, raw_value in values.items():
        try:
            parsed_value = int(raw_value)
        except (TypeError, ValueError):
            continue

        if parsed_value < 0:
            continue
        coerced[str(key)] = parsed_value
    return coerced


def resolve_plan_entitlements(plan: Plan | None) -> PlanEntitlements:
    """Resolve entitlements from the plan row and optional metadata overrides."""
    if plan is None:
        return PlanEntitlements(features=frozenset(), limits={}, points_costs={})

    default_entitlements = DEFAULT_PLAN_ENTITLEMENTS.get(plan.code)
    if default_entitlements is None:
        if plan.audience == PlanAudience.RECRUITER and plan.kind == PlanKind.SUBSCRIPTION:
            default_entitlements = PlanEntitlements(
                features=DEFAULT_RECRUITER_FEATURES,
                limits={LIMIT_MAX_JOBS: None, LIMIT_MAX_CANDIDATES: None},
                points_costs={},
            )
        elif plan.audience == PlanAudience.JOBSEEKER and plan.kind == PlanKind.SUBSCRIPTION:
            default_entitlements = PlanEntitlements(
                features=DEFAULT_JOBSEEKER_FEATURES,
                limits={},
                points_costs=DEFAULT_JOBSEEKER_POINTS_COSTS,
            )
        else:
            default_entitlements = PlanEntitlements(features=frozenset(), limits={}, points_costs={})

    metadata_payload = plan.metadata_payload if isinstance(plan.metadata_payload, dict) else {}
    return PlanEntitlements(
        features=_coerce_string_set(metadata_payload.get("features")) or default_entitlements.features,
        limits={**default_entitlements.limits, **_coerce_limit_mapping(metadata_payload.get("limits"))},
        points_costs={**default_entitlements.points_costs, **_coerce_points_cost_mapping(metadata_payload.get("points_costs"))},
    )


def get_active_subscription(db: Session, user_id: str) -> Subscription | None:
    """Return the current subscription only when it grants paid access."""
    subscription = get_current_subscription(db, user_id)
    return subscription if is_subscription_active(subscription) else None


def get_subscription_access_snapshot(db: Session, user: User) -> SubscriptionAccessSnapshot:
    """Resolve the subscription, plan, and entitlements for the current user."""
    subscription = get_current_subscription(db, user.id)
    plan = db.get(Plan, subscription.plan_id) if subscription and subscription.plan_id else None
    return SubscriptionAccessSnapshot(
        user=user,
        subscription=subscription,
        plan=plan,
        entitlements=resolve_plan_entitlements(plan),
        has_active_subscription=is_subscription_active(subscription),
    )


def require_subscription_feature(db: Session, user: User, feature_name: str) -> SubscriptionAccessSnapshot:
    """Ensure the user has an active subscription and the requested feature."""
    snapshot = get_subscription_access_snapshot(db, user)

    if not snapshot.has_active_subscription:
        raise SubscriptionRequiredError("An active subscription is required for this feature.")

    if feature_name not in snapshot.entitlements.features:
        raise FeatureEntitlementError("Your current plan does not include this feature.")

    return snapshot


def get_feature_points_cost(snapshot: SubscriptionAccessSnapshot, feature_name: str) -> int:
    """Return the points cost for a feature, or zero when the feature is not point-metered."""
    return snapshot.entitlements.points_costs.get(feature_name, 0)


def get_plan_limit(snapshot: SubscriptionAccessSnapshot, limit_name: str) -> int | None:
    """Return a plan limit or None when the limit is not capped."""
    return snapshot.entitlements.limits.get(limit_name)


def assert_plan_limit(current_count: int, limit_value: int | None, *, resource_label: str) -> None:
    """Raise when the requested action would exceed the configured plan limit."""
    if limit_value is None:
        return
    if current_count >= limit_value:
        raise PlanLimitExceededError(f"Your plan limit for {resource_label} has been reached.")


def count_recruiter_jobs(db: Session, recruiter_id: str) -> int:
    """Return the current number of job postings owned by a recruiter."""
    return db.scalar(select(func.count(JobDescription.id)).where(JobDescription.user_id == recruiter_id)) or 0


def count_recruiter_candidates(db: Session, recruiter_id: str) -> int:
    """Return the current number of candidate resumes owned by a recruiter."""
    return db.scalar(select(func.count(Resume.id)).where(Resume.user_id == recruiter_id)) or 0

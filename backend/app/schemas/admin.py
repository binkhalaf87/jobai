from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models.enums import UserRole


class AdminUserItem(BaseModel):
    id: str
    email: str
    full_name: str | None
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None
    balance_points: int | None

    model_config = {"from_attributes": True}


class AdminUsersResponse(BaseModel):
    total: int
    users: list[AdminUserItem]


class AdminUserPatch(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class AdminWalletAdjust(BaseModel):
    points: int
    reason: str


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    jobseekers: int
    recruiters: int
    admins: int
    total_resumes: int
    total_interviews: int
    total_sends: int
    total_revenue_sar: float
    total_paid_orders: int


# ── Recipient Lists ────────────────────────────────────────────────────────────

class AdminContactItem(BaseModel):
    id: str
    email: str
    full_name: str | None
    company_name: str | None
    job_title: str | None

    model_config = {"from_attributes": True}


class AdminListItem(BaseModel):
    id: str
    name: str
    description: str | None
    total_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminListCreate(BaseModel):
    name: str
    description: str | None = None


class AdminContactCreate(BaseModel):
    email: str
    full_name: str | None = None
    company_name: str | None = None
    job_title: str | None = None


class AdminContactsBulk(BaseModel):
    emails: list[str]


# ── Gmail Connection Requests ──────────────────────────────────────────────────

class AdminGmailRequestItem(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str | None
    status: str
    requested_gmail: str | None = None
    rejection_reason: str | None
    created_at: datetime
    reviewed_at: datetime | None

    model_config = {"from_attributes": True}


class AdminGmailRequestReject(BaseModel):
    reason: str | None = None


# ── Activity feed ──────────────────────────────────────────────────────────────

class AdminActivityItem(BaseModel):
    event_type: str
    user_id: str
    user_name: str | None
    user_email: str
    detail: str | None
    created_at: datetime


class AdminActivityResponse(BaseModel):
    recent_activity: list[AdminActivityItem]
    visitors_last_24h: int
    visitors_today: int
    visitors_this_month: int
    visitors_this_year: int


class AdminActivityFeedResponse(BaseModel):
    total: int
    items: list[AdminActivityItem]
    event_types: list[str]


# ── Plans (admin read-only) ───────────────────────────────────────────────────

class AdminPlanItem(BaseModel):
    id: str
    code: str
    name: str
    audience: str
    kind: str
    price_amount_minor: int | None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Promo Codes ────────────────────────────────────────────────────────────────

class AdminPromoCodeCreate(BaseModel):
    code: str
    description: str | None = None
    discount_type: str
    discount_value: int
    applicable_to: str = "all"
    plan_id: str | None = None
    max_uses: int | None = None
    max_uses_per_user: int = 1
    valid_from: datetime | None = None
    valid_until: datetime | None = None


class AdminPromoCodePatch(BaseModel):
    is_active: bool | None = None
    description: str | None = None
    max_uses: int | None = None
    valid_until: datetime | None = None


class AdminPromoCodeItem(BaseModel):
    id: str
    code: str
    description: str | None
    discount_type: str
    discount_value: int
    applicable_to: str
    plan_id: str | None
    plan_name: str | None
    max_uses: int | None
    uses_count: int
    max_uses_per_user: int
    valid_from: datetime | None
    valid_until: datetime | None
    is_active: bool
    created_by_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdminPromoCodeUsageItem(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str | None
    payment_order_id: str | None
    discount_applied_minor: int
    created_at: datetime


# ── User Profile ───────────────────────────────────────────────────────────────

class AdminUserResumeItem(BaseModel):
    id: str
    title: str
    source_filename: str | None
    file_type: str | None
    processing_status: str
    page_count: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserActivityItem(BaseModel):
    id: str
    event_type: str
    detail: str | None
    credits_used: int
    created_at: datetime


class AdminUserServiceSummaryItem(BaseModel):
    event_type: str
    count: int


class AdminUserPageViewItem(BaseModel):
    path: str
    created_at: datetime


# ── Payment Orders ────────────────────────────────────────────────────────────

class AdminPaymentOrderItem(BaseModel):
    id: str
    user_id: str
    user_email: str
    plan_code: str
    plan_name: str
    order_type: str
    status: str
    amount_minor: int
    currency: str
    provider_name: str
    provider_order_id: str | None
    provider_transaction_id: str | None
    merchant_reference: str
    failure_reason: str | None
    paid_at: datetime | None
    created_at: datetime


# ── Analytics ─────────────────────────────────────────────────────────────────

class AdminMonthlyRevenue(BaseModel):
    month: str          # "2026-01"
    revenue_sar: float
    transactions: int


class AdminVisitorPoint(BaseModel):
    label: str          # "2026-05-28" for daily, "2026-01" for monthly
    logins: int
    signups: int


class AdminAnalyticsResponse(BaseModel):
    monthly_revenue: list[AdminMonthlyRevenue]
    visitor_trends: dict[str, list[AdminVisitorPoint]]  # keys: "7d", "30d", "12mo"


class AdminGrantCreditsBody(BaseModel):
    feature: str
    quantity: int
    reason: str


class AdminUserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    role: str
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    last_login_at: datetime | None
    balance_points: int | None
    feature_credits: dict[str, int]
    activity: list[AdminUserActivityItem]
    activity_total: int
    resumes: list[AdminUserResumeItem]
    services_summary: list[AdminUserServiceSummaryItem]
    pages_visited: list[AdminUserPageViewItem]
    pages_total: int

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
    rejection_reason: str | None
    created_at: datetime
    reviewed_at: datetime | None

    model_config = {"from_attributes": True}


class AdminGmailRequestReject(BaseModel):
    reason: str | None = None


# ── Activity feed ──────────────────────────────────────────────────────────────

class AdminActivityItem(BaseModel):
    event_type: str
    user_name: str | None
    user_email: str
    detail: str | None
    created_at: datetime


class AdminActivityResponse(BaseModel):
    recent_activity: list[AdminActivityItem]
    visitors_last_24h: int


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

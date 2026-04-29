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

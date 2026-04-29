from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_validator


# ── Gmail Connection ───────────────────────────────────────────────────────────

class GmailStatusResponse(BaseModel):
    is_connected: bool
    gmail_address: str | None = None

    model_config = {"from_attributes": True}


# ── Generate Cover Letter ──────────────────────────────────────────────────────

class GenerateLetterRequest(BaseModel):
    job_title: str
    company_name: str | None = None
    job_description: str | None = None
    resume_id: str | None = None


class GenerateLetterResponse(BaseModel):
    subject: str
    body: str


# ── Send ───────────────────────────────────────────────────────────────────────

class SendRequest(BaseModel):
    job_title: str
    company_name: str | None = None
    subject: str
    body: str
    recipient_email: str
    recipient_name: str | None = None
    resume_id: str | None = None

    @field_validator("recipient_email")
    @classmethod
    def lower_email(cls, v: str) -> str:
        return v.lower().strip()


class SendResponse(BaseModel):
    id: str
    status: str
    recipient_email: str
    sent_at: datetime | None

    model_config = {"from_attributes": True}


# ── History ────────────────────────────────────────────────────────────────────

class SendHistoryItem(BaseModel):
    id: str
    job_title: str
    company_name: str | None
    subject: str
    recipient_email: str
    recipient_name: str | None
    status: str
    error_message: str | None
    sent_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Recipient Lists ────────────────────────────────────────────────────────────

class RecipientListItem(BaseModel):
    id: str
    name: str
    description: str | None
    total_count: int
    contacts: list[dict[str, Any]] = []


# ── Campaigns ──────────────────────────────────────────────────────────────────

class CampaignCreate(BaseModel):
    list_id: str
    subject: str
    body: str
    resume_id: str | None = None
    daily_limit: int = 100


class CampaignResponse(BaseModel):
    id: str
    list_name: str | None
    subject: str
    status: str
    daily_limit: int
    total_contacts: int
    total_sent: int
    total_failed: int
    estimated_days_remaining: int
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

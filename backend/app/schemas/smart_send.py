from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, field_validator


# ── SMTP Connection ────────────────────────────────────────────────────────────

class SmtpConnectionCreate(BaseModel):
    gmail_address: str
    display_name: str
    app_password: str  # plaintext — encrypted before storage

    @field_validator("app_password")
    @classmethod
    def validate_app_password(cls, v: str) -> str:
        clean = v.replace(" ", "")
        if len(clean) != 16:
            raise ValueError("Gmail app password must be 16 characters (spaces ignored)")
        return clean

    @field_validator("gmail_address")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Must be a valid email address")
        return v.lower().strip()


class SmtpConnectionResponse(BaseModel):
    id: str
    gmail_address: str
    display_name: str
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Generate Cover Letters ─────────────────────────────────────────────────────

class GenerateLettersRequest(BaseModel):
    job_title: str
    company_name: str | None = None
    job_description: str | None = None
    resume_id: str | None = None


class LetterVariant(BaseModel):
    subject: str
    body: str


class GeneratedLetters(BaseModel):
    formal: LetterVariant
    creative: LetterVariant
    concise: LetterVariant


class GenerateLettersResponse(BaseModel):
    campaign_id: str
    letters: GeneratedLetters


# ── Recipients ─────────────────────────────────────────────────────────────────

class RecipientIn(BaseModel):
    email: str
    name: str | None = None

    @field_validator("email")
    @classmethod
    def lower_email(cls, v: str) -> str:
        return v.lower().strip()


# ── Send Campaign ──────────────────────────────────────────────────────────────

class SendCampaignCreate(BaseModel):
    campaign_id: str
    selected_variant: str  # formal | creative | concise
    # user may edit the subject/body after generation
    subject: str
    body: str
    recipients: list[RecipientIn]

    @field_validator("selected_variant")
    @classmethod
    def validate_variant(cls, v: str) -> str:
        if v not in ("formal", "creative", "concise"):
            raise ValueError("selected_variant must be formal, creative, or concise")
        return v

    @field_validator("recipients")
    @classmethod
    def at_least_one(cls, v: list) -> list:
        if len(v) == 0:
            raise ValueError("At least one recipient required")
        if len(v) > 100:
            raise ValueError("Maximum 100 recipients per campaign")
        return v


class SendLogResponse(BaseModel):
    id: str
    recipient_email: str
    recipient_name: str | None
    status: str
    error_message: str | None
    sent_at: datetime | None

    model_config = {"from_attributes": True}


class CampaignResponse(BaseModel):
    id: str
    job_title: str
    company_name: str | None
    status: str
    total_recipients: int
    sent_count: int
    failed_count: int
    selected_variant: str | None
    subject: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    logs: list[SendLogResponse] = []

    model_config = {"from_attributes": True}

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.enums import TicketCategory, TicketStatus


class TicketCreate(BaseModel):
    category: TicketCategory
    subject: str
    body: str

    @field_validator("subject")
    @classmethod
    def subject_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Subject cannot be empty.")
        return v

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message body cannot be empty.")
        return v


class TicketMessageCreate(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message body cannot be empty.")
        return v


class TicketStatusUpdate(BaseModel):
    status: TicketStatus


class MessageResponse(BaseModel):
    id: str
    body: str
    is_admin_message: bool
    sender_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TicketResponse(BaseModel):
    id: str
    category: TicketCategory
    subject: str
    status: TicketStatus
    unread_by_user: bool
    unread_by_admin: bool
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TicketDetailResponse(BaseModel):
    id: str
    category: TicketCategory
    subject: str
    status: TicketStatus
    unread_by_user: bool
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse]

    model_config = {"from_attributes": True}


class AdminTicketResponse(BaseModel):
    id: str
    category: TicketCategory
    subject: str
    status: TicketStatus
    unread_by_admin: bool
    user_email: str
    user_name: str | None
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    count: int

from datetime import datetime

from app.models.enums import UsageEventType
from app.schemas.base import ORMBaseSchema


class UsageLogBase(ORMBaseSchema):
    event_type: UsageEventType
    request_id: str | None = None
    credits_used: int = 0
    detail: str | None = None
    event_payload: dict | None = None


class UsageLogCreate(UsageLogBase):
    analysis_id: str | None = None


class UsageLogRead(UsageLogBase):
    id: str
    user_id: str
    analysis_id: str | None = None
    created_at: datetime


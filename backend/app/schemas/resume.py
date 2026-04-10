from datetime import datetime

from pydantic import Field

from app.models.enums import ResumeProcessingStatus
from app.schemas.base import ORMBaseSchema, TimestampedSchema


class ResumeStructuredData(ORMBaseSchema):
    name: str | None = None
    summary: str | None = None
    skills: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)


class ResumeBase(ORMBaseSchema):
    title: str
    source_filename: str | None = None
    file_type: str | None = None
    page_count: int | None = None
    processing_status: ResumeProcessingStatus = ResumeProcessingStatus.UPLOADED


class ResumeCreate(ResumeBase):
    raw_text: str | None = None
    normalized_text: str | None = None
    structured_data: ResumeStructuredData | None = None


class ResumeRead(ResumeBase, TimestampedSchema):
    id: str
    user_id: str
    storage_key: str | None = None
    raw_text: str | None = None
    normalized_text: str | None = None
    structured_data: ResumeStructuredData | None = None


class ResumeListItem(ORMBaseSchema):
    id: str
    title: str
    source_filename: str | None = None
    file_type: str | None = None
    page_count: int | None = None
    processing_status: ResumeProcessingStatus
    created_at: datetime


class ResumeUploadResponse(ORMBaseSchema):
    resume_id: str


class ResumeTextPreviewResponse(ORMBaseSchema):
    id: str
    title: str
    source_filename: str | None = None
    processing_status: ResumeProcessingStatus
    raw_text_preview: str
    normalized_text_preview: str
    structured_data: ResumeStructuredData | None = None

from pydantic import Field

from app.models.enums import SuggestionSection
from app.schemas.base import ORMBaseSchema, TimestampedSchema


class RewriteSuggestionBase(ORMBaseSchema):
    section: SuggestionSection
    original_text: str | None = None
    suggested_text: str
    rationale: str | None = None
    is_applied: bool = False
    display_order: int = 0
    anchor_label: str | None = None


class RewriteSuggestionCreate(RewriteSuggestionBase):
    analysis_id: str


class RewriteSuggestionRead(RewriteSuggestionBase, TimestampedSchema):
    id: str
    analysis_id: str


class RewriteSuggestionGenerateRequest(ORMBaseSchema):
    analysis_id: str
    section: SuggestionSection
    source_text: str = Field(min_length=1)
    missing_keywords: list[str] = Field(min_length=1)
    anchor_label: str | None = None


class RewriteSuggestionGenerateResponse(ORMBaseSchema):
    analysis_id: str
    section: SuggestionSection
    suggestions: list[RewriteSuggestionRead]

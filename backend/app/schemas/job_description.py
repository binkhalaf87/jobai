from pydantic import Field

from app.models.enums import EmploymentType
from app.schemas.base import ORMBaseSchema, TimestampedSchema


class JobDescriptionKeywordData(ORMBaseSchema):
    hard_skills: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    job_titles: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    years_of_experience: list[str] = Field(default_factory=list)
    role_keywords: list[str] = Field(default_factory=list)


class JobDescriptionBase(ORMBaseSchema):
    title: str
    company_name: str | None = None
    source_url: str | None = None
    source_text: str
    employment_type: EmploymentType | None = None
    location_text: str | None = None


class JobDescriptionCreate(JobDescriptionBase):
    pass


class JobDescriptionRead(JobDescriptionBase, TimestampedSchema):
    id: str
    user_id: str
    normalized_text: str | None = None
    keyword_data: JobDescriptionKeywordData | None = None


class JobDescriptionListItem(TimestampedSchema):
    id: str
    title: str
    company_name: str | None = None
    normalized_text: str | None = None


class JobDescriptionSubmitResponse(ORMBaseSchema):
    job_description_id: str
    title: str
    normalized_text_preview: str
    keyword_data: JobDescriptionKeywordData | None = None

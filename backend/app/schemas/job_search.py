from datetime import datetime

from pydantic import BaseModel

from app.schemas.base import ORMBaseSchema


class JobSearchRequest(BaseModel):
    query: str
    location: str = ""
    page: int = 1
    date_posted: str = "all"           # all | today | 3days | week | month
    employment_type: str = ""          # FULLTIME | PARTTIME | CONTRACTOR | INTERN (comma-sep)
    resume_id: str | None = None       # if provided, compute AI fit score for each result


class JobResult(BaseModel):
    job_id: str
    job_title: str
    company_name: str
    employer_logo: str | None = None
    location: str | None = None
    employment_type: str | None = None
    job_description: str | None = None
    apply_link: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    salary_currency: str | None = None
    source: str | None = None
    posted_at: str | None = None
    fit_score: float | None = None     # 0–100, computed when resume_id provided
    is_saved: bool = False


class JobSearchResponse(BaseModel):
    query: str
    location: str
    page: int
    total_found: int
    results: list[JobResult]


class SaveJobRequest(BaseModel):
    job_id: str
    job_title: str
    company_name: str
    employer_logo: str | None = None
    location: str | None = None
    employment_type: str | None = None
    job_description: str | None = None
    apply_link: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    salary_currency: str | None = None
    source: str | None = None
    fit_score: float | None = None
    posted_at: str | None = None


class SavedJobResponse(ORMBaseSchema):
    id: str
    job_id: str
    job_title: str
    company_name: str
    employer_logo: str | None
    location: str | None
    employment_type: str | None
    job_description: str | None
    apply_link: str | None
    salary_min: float | None
    salary_max: float | None
    salary_currency: str | None
    source: str | None
    fit_score: float | None
    posted_at: datetime | None
    created_at: datetime

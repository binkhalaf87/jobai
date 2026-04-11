from datetime import datetime

from app.schemas.base import ORMBaseSchema


class AIReportRequest(ORMBaseSchema):
    resume_id: str
    job_description: str | None = None
    report_type: str = "analysis"


class AIReportListItem(ORMBaseSchema):
    id: str
    resume_id: str
    resume_title: str | None
    report_type: str
    status: str
    created_at: datetime
    completed_at: datetime | None


class AIReportFull(ORMBaseSchema):
    id: str
    resume_id: str
    resume_title: str | None
    job_description_text: str | None
    model_name: str | None
    status: str
    report_text: str | None
    created_at: datetime
    completed_at: datetime | None

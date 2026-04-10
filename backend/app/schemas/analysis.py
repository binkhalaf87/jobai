from datetime import datetime

from app.models.enums import AnalysisStatus
from app.schemas.base import ORMBaseSchema, TimestampedSchema


class AnalysisBase(ORMBaseSchema):
    status: AnalysisStatus = AnalysisStatus.QUEUED
    model_name: str | None = None
    overall_score: float | None = None
    summary_text: str | None = None
    result_payload: dict | None = None
    completed_at: datetime | None = None


class AnalysisCreate(AnalysisBase):
    resume_id: str
    job_description_id: str


class AnalysisMatchRequest(ORMBaseSchema):
    resume_id: str
    job_description_id: str


class AnalysisMatchResult(ORMBaseSchema):
    match_score: float
    matching_keywords: list[str]
    missing_keywords: list[str]
    cosine_similarity_score: float


class AnalysisMatchResponse(ORMBaseSchema):
    analysis_id: str
    resume_id: str
    job_description_id: str
    result: AnalysisMatchResult


class AnalysisAtsRequest(ORMBaseSchema):
    resume_id: str
    job_description_id: str


class AnalysisAtsIssue(ORMBaseSchema):
    category: str
    severity: str
    message: str


class AnalysisAtsResult(ORMBaseSchema):
    ats_score: float
    issues: list[AnalysisAtsIssue]
    suggestions: list[str]


class AnalysisAtsResponse(ORMBaseSchema):
    analysis_id: str
    resume_id: str
    job_description_id: str
    result: AnalysisAtsResult


class AnalysisScoreRequest(ORMBaseSchema):
    resume_id: str
    job_description_id: str


class ScoreBreakdownItem(ORMBaseSchema):
    score: float
    weight: float
    weighted_score: float


class AnalysisScoreBreakdown(ORMBaseSchema):
    match: ScoreBreakdownItem
    ats: ScoreBreakdownItem
    content: ScoreBreakdownItem
    completeness: ScoreBreakdownItem


class AnalysisScoreResult(ORMBaseSchema):
    overall_score: float
    detailed_score_breakdown: AnalysisScoreBreakdown
    explanation: str


class AnalysisScoreResponse(ORMBaseSchema):
    analysis_id: str
    resume_id: str
    job_description_id: str
    result: AnalysisScoreResult


class FullAnalysisResult(ORMBaseSchema):
    job_description_keywords: dict
    match: AnalysisMatchResult
    ats: AnalysisAtsResult
    score: AnalysisScoreResult


class AnalysisFullRequest(ORMBaseSchema):
    resume_id: str
    job_description_id: str


class AnalysisFullResponse(ORMBaseSchema):
    analysis_id: str
    resume_id: str
    job_description_id: str
    result: FullAnalysisResult


class AnalysisRead(AnalysisBase, TimestampedSchema):
    id: str
    user_id: str
    resume_id: str
    job_description_id: str

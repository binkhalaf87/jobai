from datetime import datetime

from pydantic import BaseModel, field_validator

from app.schemas.base import ORMBaseSchema

VALID_EXPERIENCE_LEVELS = {"entry", "mid", "senior"}
VALID_INTERVIEW_TYPES = {"hr", "technical", "mixed"}
VALID_LANGUAGES = {"en", "ar"}
VALID_QUESTION_COUNTS = {3, 5, 10}


class InterviewSetupRequest(BaseModel):
    job_title: str
    experience_level: str = "mid"
    interview_type: str = "mixed"
    language: str = "en"
    question_count: int = 5

    @field_validator("experience_level")
    @classmethod
    def validate_experience_level(cls, v: str) -> str:
        if v not in VALID_EXPERIENCE_LEVELS:
            raise ValueError(f"experience_level must be one of {VALID_EXPERIENCE_LEVELS}")
        return v

    @field_validator("interview_type")
    @classmethod
    def validate_interview_type(cls, v: str) -> str:
        if v not in VALID_INTERVIEW_TYPES:
            raise ValueError(f"interview_type must be one of {VALID_INTERVIEW_TYPES}")
        return v

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in VALID_LANGUAGES:
            raise ValueError(f"language must be one of {VALID_LANGUAGES}")
        return v

    @field_validator("question_count")
    @classmethod
    def validate_question_count(cls, v: int) -> int:
        if v not in VALID_QUESTION_COUNTS:
            raise ValueError(f"question_count must be one of {VALID_QUESTION_COUNTS}")
        return v

    @field_validator("job_title")
    @classmethod
    def validate_job_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("job_title cannot be empty")
        return v


class InterviewQuestion(BaseModel):
    index: int
    question: str
    type: str  # hr | technical


class InterviewSessionResponse(ORMBaseSchema):
    id: str
    job_title: str
    experience_level: str
    interview_type: str
    language: str
    question_count: int
    questions: list[dict]
    status: str
    created_at: datetime


class AnswerSubmitRequest(BaseModel):
    question_index: int
    question: str
    answer: str

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Answer cannot be empty")
        return v


class AnswerEvaluation(BaseModel):
    score: float
    strengths: list[str]
    weaknesses: list[str]
    improved_answer: str


class AnswerEvaluationResponse(BaseModel):
    question_index: int
    evaluation: AnswerEvaluation


class ScoreBreakdown(BaseModel):
    relevance: float
    clarity: float
    professionalism: float
    confidence: float
    role_fit: float


class FinalReport(BaseModel):
    overall_score: float
    readiness: str  # "Needs Improvement" | "Good Progress" | "Interview Ready"
    summary: str
    breakdown: ScoreBreakdown


class InterviewCompleteResponse(ORMBaseSchema):
    id: str
    job_title: str
    experience_level: str
    interview_type: str
    language: str
    question_count: int
    questions: list[dict]
    answers: list[dict]
    overall_score: float
    final_report: dict
    status: str
    created_at: datetime


class InterviewListItem(ORMBaseSchema):
    id: str
    job_title: str
    experience_level: str
    interview_type: str
    language: str
    question_count: int
    overall_score: float | None
    status: str
    created_at: datetime

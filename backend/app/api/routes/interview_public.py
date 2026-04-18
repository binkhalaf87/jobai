"""Public candidate interview endpoints — no authentication required."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.models.interview_response import InterviewResponse
from app.models.job_description import JobDescription
from app.models.recruiter_interview import RecruiterInterview
from app.models.resume import Resume

router = APIRouter(prefix="/interview", tags=["candidate-interview"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class PublicQuestion(BaseModel):
    index: int
    question: str
    type: str
    focus_area: str | None


class PublicInterviewInfo(BaseModel):
    interview_id: str
    candidate_name: str
    job_title: str
    company_name: str | None
    interview_type: str
    language: str
    questions: list[PublicQuestion]
    already_completed: bool


class AnswerSubmission(BaseModel):
    question_index: int
    question_text: str
    video_data: str | None = None   # base64 WebM
    text_answer: str | None = None


class AnswerResult(BaseModel):
    saved: bool
    questions_answered: int
    total_questions: int
    completed: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _resolve_token(db: Session, token: str) -> RecruiterInterview:
    interview = db.scalar(
        select(RecruiterInterview).where(RecruiterInterview.invite_token == token)
    )
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview link not found.")

    now = datetime.now(timezone.utc)
    if interview.invite_expires_at and interview.invite_expires_at < now:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="This interview link has expired.")

    return interview


def _candidate_name(resume: Resume) -> str:
    if isinstance(resume.structured_data, dict):
        name = resume.structured_data.get("name")
        if name:
            return str(name)
    return resume.title


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/token/{token}", response_model=PublicInterviewInfo)
def get_interview_by_token(token: str, db: Session = Depends(get_db)) -> PublicInterviewInfo:
    """Return interview questions for the candidate — no auth required."""
    interview = _resolve_token(db, token)

    resume = db.get(Resume, interview.resume_id)
    job = db.get(JobDescription, interview.job_id)

    if not resume or not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview data not found.")

    questions_raw = (interview.generated_questions or {}).get("questions", [])
    questions = [
        PublicQuestion(
            index=int(q.get("index", i)),
            question=str(q.get("question", "")),
            type=str(q.get("type", "hr")),
            focus_area=q.get("focus_area"),
        )
        for i, q in enumerate(questions_raw)
    ]

    return PublicInterviewInfo(
        interview_id=interview.id,
        candidate_name=_candidate_name(resume),
        job_title=job.title,
        company_name=job.company_name,
        interview_type=interview.interview_type,
        language=interview.language,
        questions=questions,
        already_completed=interview.response_status == "completed",
    )


@router.get("/token/{token}/status")
def get_interview_status(token: str, db: Session = Depends(get_db)) -> dict:
    """Check whether this token is still valid and how many answers were submitted."""
    interview = _resolve_token(db, token)

    total = len((interview.generated_questions or {}).get("questions", []))
    count = db.query(InterviewResponse).filter(InterviewResponse.interview_id == interview.id).count()

    return {
        "response_status": interview.response_status,
        "questions_answered": count,
        "total_questions": total,
    }



@router.post("/token/{token}/answer", response_model=AnswerResult)
def submit_answer(
    token: str,
    payload: AnswerSubmission,
    db: Session = Depends(get_db),
) -> AnswerResult:
    """Submit a single question answer. Can be called once per question."""
    interview = _resolve_token(db, token)

    if interview.response_status == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This interview has already been completed.",
        )

    if not payload.video_data and not payload.text_answer:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide either video_data or text_answer.",
        )

    # Upsert: one response per question index
    existing = db.scalar(
        select(InterviewResponse).where(
            InterviewResponse.interview_id == interview.id,
            InterviewResponse.question_index == payload.question_index,
        )
    )
    if existing:
        existing.video_data = payload.video_data
        existing.text_answer = payload.text_answer
        existing.question_text = payload.question_text
    else:
        db.add(
            InterviewResponse(
                interview_id=interview.id,
                question_index=payload.question_index,
                question_text=payload.question_text,
                video_data=payload.video_data,
                text_answer=payload.text_answer,
            )
        )

    # Mark in_progress on first answer
    if interview.response_status == "sent":
        interview.response_status = "in_progress"

    db.commit()

    total = len((interview.generated_questions or {}).get("questions", []))
    answered = db.query(InterviewResponse).filter(InterviewResponse.interview_id == interview.id).count()

    completed = answered >= total
    if completed:
        interview.response_status = "completed"
        db.commit()

    return AnswerResult(
        saved=True,
        questions_answered=answered,
        total_questions=total,
        completed=completed,
    )

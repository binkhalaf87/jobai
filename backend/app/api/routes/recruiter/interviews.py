"""Recruiter AI Interview — generate tailored question sets for candidate + job combinations."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_recruiter
from app.api.deps.db import get_db
from app.models.job_description import JobDescription
from app.models.recruiter_interview import RecruiterInterview
from app.models.resume import Resume
from app.models.user import User
from app.services.recruiter_interview_service import generate_interview_questions

router = APIRouter(prefix="/recruiter/interviews", tags=["recruiter-interviews"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class GenerateInterviewRequest(BaseModel):
    resume_id: str
    job_id: str
    interview_type: str = "mixed"  # hr | technical | mixed
    language: str = "en"
    question_count: int = 8


class InterviewQuestion(BaseModel):
    index: int
    question: str
    type: str
    focus_area: str | None


class RecruiterInterviewResponse(BaseModel):
    id: str
    resume_id: str
    job_id: str
    candidate_name: str
    job_title: str
    interview_type: str
    language: str
    status: str
    candidate_summary: str
    focus_areas: list[str]
    questions: list[InterviewQuestion]
    created_at: datetime


class RecruiterInterviewListItem(BaseModel):
    id: str
    resume_id: str
    job_id: str
    candidate_name: str
    job_title: str
    interview_type: str
    question_count: int
    status: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_owned_resume(db: Session, resume_id: str, recruiter_id: str) -> Resume:
    resume = db.get(Resume, resume_id)
    if not resume or resume.user_id != recruiter_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
    return resume


def _get_owned_job(db: Session, job_id: str, recruiter_id: str) -> JobDescription:
    job = db.get(JobDescription, job_id)
    if not job or job.user_id != recruiter_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return job


def _get_owned_interview(db: Session, interview_id: str, recruiter_id: str) -> RecruiterInterview:
    interview = db.get(RecruiterInterview, interview_id)
    if not interview or interview.recruiter_id != recruiter_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")
    return interview


def _candidate_name(resume: Resume) -> str:
    if isinstance(resume.structured_data, dict):
        name = resume.structured_data.get("name")
        if name:
            return str(name)
    return resume.title


def _build_response(
    interview: RecruiterInterview,
    resume: Resume,
    job: JobDescription,
) -> RecruiterInterviewResponse:
    payload = interview.generated_questions or {}
    questions_raw = payload.get("questions", [])
    questions = [
        InterviewQuestion(
            index=int(q.get("index", i)),
            question=str(q.get("question", "")),
            type=str(q.get("type", "hr")),
            focus_area=q.get("focus_area"),
        )
        for i, q in enumerate(questions_raw)
    ]
    return RecruiterInterviewResponse(
        id=interview.id,
        resume_id=interview.resume_id,
        job_id=interview.job_id,
        candidate_name=_candidate_name(resume),
        job_title=job.title,
        interview_type=interview.interview_type,
        language=interview.language,
        status=interview.status,
        candidate_summary=payload.get("candidate_summary", ""),
        focus_areas=payload.get("focus_areas", []),
        questions=questions,
        created_at=interview.created_at,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/", response_model=RecruiterInterviewResponse, status_code=status.HTTP_201_CREATED)
def generate_interview(
    payload: GenerateInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> RecruiterInterviewResponse:
    """Generate an AI interview question set for a specific candidate + job."""
    if payload.interview_type not in {"hr", "technical", "mixed"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="interview_type must be one of: hr, technical, mixed.",
        )
    if payload.language not in {"en", "ar"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="language must be 'en' or 'ar'.",
        )
    if not (3 <= payload.question_count <= 15):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="question_count must be between 3 and 15.",
        )

    resume = _get_owned_resume(db, payload.resume_id, current_user.id)
    job = _get_owned_job(db, payload.job_id, current_user.id)

    try:
        interview = generate_interview_questions(
            db=db,
            recruiter_id=current_user.id,
            resume=resume,
            job=job,
            interview_type=payload.interview_type,
            language=payload.language,
            question_count=payload.question_count,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to generate interview questions. Please try again.",
        ) from exc

    return _build_response(interview, resume, job)


@router.get("/", response_model=list[RecruiterInterviewListItem])
def list_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> list[RecruiterInterviewListItem]:
    """List all recruiter-generated interview sets, newest first."""
    interviews = list(
        db.scalars(
            select(RecruiterInterview)
            .where(RecruiterInterview.recruiter_id == current_user.id)
            .order_by(RecruiterInterview.created_at.desc())
        )
    )

    items: list[RecruiterInterviewListItem] = []
    for interview in interviews:
        resume = db.get(Resume, interview.resume_id)
        job = db.get(JobDescription, interview.job_id)
        if not resume or not job:
            continue
        questions = (interview.generated_questions or {}).get("questions", [])
        items.append(
            RecruiterInterviewListItem(
                id=interview.id,
                resume_id=interview.resume_id,
                job_id=interview.job_id,
                candidate_name=_candidate_name(resume),
                job_title=job.title,
                interview_type=interview.interview_type,
                question_count=len(questions),
                status=interview.status,
                created_at=interview.created_at,
            )
        )

    return items


@router.get("/{interview_id}", response_model=RecruiterInterviewResponse)
def get_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> RecruiterInterviewResponse:
    """Retrieve a specific recruiter interview with all generated questions."""
    interview = _get_owned_interview(db, interview_id, current_user.id)
    resume = db.get(Resume, interview.resume_id)
    job = db.get(JobDescription, interview.job_id)

    if not resume or not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated candidate or job no longer exists.",
        )

    return _build_response(interview, resume, job)


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> None:
    """Delete a recruiter interview question set."""
    interview = _get_owned_interview(db, interview_id, current_user.id)
    db.delete(interview)
    db.commit()

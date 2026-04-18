"""Recruiter AI Interview — generate tailored question sets for candidate + job combinations."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_recruiter
from app.api.deps.db import get_db
from app.core.config import get_settings
from app.models.interview_response import InterviewResponse
from app.models.job_description import JobDescription
from app.models.recruiter_interview import RecruiterInterview
from app.models.resume import Resume
from app.models.smtp_connection import SmtpConnection
from app.models.user import User
from app.services.recruiter_interview_service import analyse_interview_responses, generate_interview_questions
from app.services.smtp_service import send_email

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
    response_status: str
    invite_sent_at: datetime | None
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
    response_status: str
    invite_sent_at: datetime | None
    created_at: datetime


class QuestionFeedback(BaseModel):
    index: int
    score: int
    feedback: str
    strength: str
    weakness: str


class InterviewResponseItem(BaseModel):
    question_index: int
    question_text: str
    text_answer: str | None
    has_video: bool
    video_data: str | None
    submitted_at: datetime


class InterviewResponsesResult(BaseModel):
    interview_id: str
    candidate_name: str
    job_title: str
    overall_score: int | None
    overall_impression: str | None
    hire_recommendation: str | None
    per_question: list[QuestionFeedback]
    responses: list[InterviewResponseItem]


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
        response_status=interview.response_status,
        invite_sent_at=interview.invite_sent_at,
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
                response_status=interview.response_status,
                invite_sent_at=interview.invite_sent_at,
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


@router.post("/{interview_id}/send-invite", status_code=status.HTTP_200_OK)
def send_invite(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> dict:
    """Generate a unique invite link and email it to the candidate."""
    interview = _get_owned_interview(db, interview_id, current_user.id)

    if interview.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview questions must be ready before sending an invite.",
        )

    resume = db.get(Resume, interview.resume_id)
    job = db.get(JobDescription, interview.job_id)
    if not resume or not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated data not found.")

    candidate_email = None
    if isinstance(resume.structured_data, dict):
        contact = resume.structured_data.get("contact", {})
        candidate_email = contact.get("email") if isinstance(contact, dict) else None
        if not candidate_email:
            candidate_email = resume.structured_data.get("email")

    if not candidate_email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No email address found in the candidate's resume.",
        )

    smtp_conn = db.query(SmtpConnection).filter(SmtpConnection.user_id == current_user.id).first()
    if not smtp_conn or not smtp_conn.is_verified:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please set up and verify your Gmail SMTP connection in Smart Send before sending invites.",
        )

    # Generate or reuse token
    token = interview.invite_token or secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=7)

    settings = get_settings()
    # Use the first allowed origin as the frontend base URL
    origins = settings.allowed_origins()
    frontend_url = origins[0].rstrip("/") if origins else "https://jobai-alpha.vercel.app"
    interview_link = f"{frontend_url}/interview/{token}"

    candidate_name = _candidate_name(resume)
    questions = (interview.generated_questions or {}).get("questions", [])
    question_count = len(questions)
    is_arabic = interview.language == "ar"

    if is_arabic:
        subject = f"دعوة لمقابلة فيديو ذكية — {job.title}"
        body = (
            f"مرحباً {candidate_name}،\n\n"
            f"تمت دعوتك لإجراء مقابلة فيديو لوظيفة: {job.title}\n\n"
            f"المقابلة تتضمن {question_count} سؤال. ستتمكن من تسجيل إجاباتك بالفيديو بشكل مريح من أي مكان.\n\n"
            f"رابط المقابلة:\n{interview_link}\n\n"
            f"الرابط صالح حتى: {expires.strftime('%Y-%m-%d')}\n\n"
            "بالتوفيق،\nفريق التوظيف"
        )
    else:
        subject = f"You've been invited for an AI video interview — {job.title}"
        body = (
            f"Hi {candidate_name},\n\n"
            f"You've been invited to complete a video interview for the position: {job.title}\n\n"
            f"The interview consists of {question_count} question(s). You can record your answers "
            "comfortably from anywhere, at your own pace.\n\n"
            f"Interview link:\n{interview_link}\n\n"
            f"This link expires on: {expires.strftime('%B %d, %Y')}\n\n"
            "Good luck!\nThe Hiring Team"
        )

    try:
        send_email(
            smtp_conn=smtp_conn,
            to_email=candidate_email,
            to_name=candidate_name,
            subject=subject,
            body=body,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to send email: {exc}",
        ) from exc

    interview.invite_token = token
    interview.invite_sent_at = now
    interview.invite_expires_at = expires
    interview.response_status = "sent"
    db.commit()

    return {"message": "Invite sent successfully.", "candidate_email": candidate_email}


@router.get("/{interview_id}/responses", response_model=InterviewResponsesResult)
def get_responses(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> InterviewResponsesResult:
    """Return candidate responses with GPT analysis for a completed interview."""
    interview = _get_owned_interview(db, interview_id, current_user.id)

    resume = db.get(Resume, interview.resume_id)
    job = db.get(JobDescription, interview.job_id)
    if not resume or not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated data not found.")

    responses = list(
        db.scalars(
            select(InterviewResponse)
            .where(InterviewResponse.interview_id == interview_id)
            .order_by(InterviewResponse.question_index)
        )
    )

    questions = (interview.generated_questions or {}).get("questions", [])

    response_items = [
        InterviewResponseItem(
            question_index=r.question_index,
            question_text=r.question_text,
            text_answer=r.text_answer,
            has_video=bool(r.video_data),
            video_data=r.video_data,
            submitted_at=r.submitted_at,
        )
        for r in responses
    ]

    analysis: dict = {}
    if responses:
        try:
            analysis = analyse_interview_responses(
                job_title=job.title,
                language=interview.language,
                questions=questions,
                responses=responses,
            )
        except Exception:
            pass

    per_question = [
        QuestionFeedback(
            index=int(pq.get("index", 0)),
            score=int(pq.get("score", 0)),
            feedback=str(pq.get("feedback", "")),
            strength=str(pq.get("strength", "")),
            weakness=str(pq.get("weakness", "")),
        )
        for pq in analysis.get("per_question", [])
    ]

    return InterviewResponsesResult(
        interview_id=interview_id,
        candidate_name=_candidate_name(resume),
        job_title=job.title,
        overall_score=analysis.get("overall_score"),
        overall_impression=analysis.get("overall_impression"),
        hire_recommendation=analysis.get("hire_recommendation"),
        per_question=per_question,
        responses=response_items,
    )

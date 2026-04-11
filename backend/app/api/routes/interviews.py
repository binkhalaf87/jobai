from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.models.user import User
from app.schemas.interview import (
    AnswerEvaluationResponse,
    AnswerSubmitRequest,
    InterviewCompleteResponse,
    InterviewListItem,
    InterviewSessionResponse,
    InterviewSetupRequest,
)
from app.services.interview_service import (
    complete_session,
    evaluate_answer,
    get_session,
    list_sessions,
    create_session,
)

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.post("/sessions", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
def start_interview_session(
    payload: InterviewSetupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewSessionResponse:
    """Create a new interview session and generate role-specific questions via AI."""
    try:
        session = create_session(
            db=db,
            user_id=current_user.id,
            job_title=payload.job_title,
            experience_level=payload.experience_level,
            interview_type=payload.interview_type,
            language=payload.language,
            question_count=payload.question_count,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to generate interview questions. Please try again.",
        ) from exc

    questions = (session.questions or {}).get("items", [])
    return InterviewSessionResponse(
        id=session.id,
        job_title=session.job_title,
        experience_level=session.experience_level,
        interview_type=session.interview_type,
        language=session.language,
        question_count=session.question_count,
        questions=questions,
        status=session.status,
        created_at=session.created_at,
    )


@router.post(
    "/sessions/{session_id}/answer",
    response_model=AnswerEvaluationResponse,
    status_code=status.HTTP_200_OK,
)
def submit_answer(
    session_id: str,
    payload: AnswerSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnswerEvaluationResponse:
    """Submit a candidate answer and receive AI evaluation for that question."""
    session = get_session(db, current_user.id, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    if session.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This session is already completed.",
        )

    try:
        evaluation = evaluate_answer(
            db=db,
            session=session,
            question_index=payload.question_index,
            question=payload.question,
            answer=payload.answer,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to evaluate answer. Please try again.",
        ) from exc

    return AnswerEvaluationResponse(
        question_index=payload.question_index,
        evaluation=evaluation,  # type: ignore[arg-type]
    )


@router.post(
    "/sessions/{session_id}/complete",
    response_model=InterviewCompleteResponse,
    status_code=status.HTTP_200_OK,
)
def complete_interview_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewCompleteResponse:
    """Finalize the session, compute the overall score, and generate a final report."""
    session = get_session(db, current_user.id, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    if session.status == "completed":
        # Idempotent — return the existing completed session
        questions = (session.questions or {}).get("items", [])
        answers = (session.answers or {}).get("items", [])
        return InterviewCompleteResponse(
            id=session.id,
            job_title=session.job_title,
            experience_level=session.experience_level,
            interview_type=session.interview_type,
            language=session.language,
            question_count=session.question_count,
            questions=questions,
            answers=answers,
            overall_score=session.overall_score or 0.0,
            final_report=session.final_report or {},
            status=session.status,
            created_at=session.created_at,
        )

    try:
        session = complete_session(db, session)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to generate final report. Please try again.",
        ) from exc

    questions = (session.questions or {}).get("items", [])
    answers = (session.answers or {}).get("items", [])
    return InterviewCompleteResponse(
        id=session.id,
        job_title=session.job_title,
        experience_level=session.experience_level,
        interview_type=session.interview_type,
        language=session.language,
        question_count=session.question_count,
        questions=questions,
        answers=answers,
        overall_score=session.overall_score or 0.0,
        final_report=session.final_report or {},
        status=session.status,
        created_at=session.created_at,
    )


@router.get("/sessions", response_model=list[InterviewListItem])
def list_interview_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[InterviewListItem]:
    """Return all interview sessions for the current user, newest first."""
    return list_sessions(db, current_user.id)  # type: ignore[return-value]


@router.get("/sessions/{session_id}", response_model=InterviewCompleteResponse)
def get_interview_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewCompleteResponse:
    """Retrieve a specific session with all questions, answers, and report."""
    session = get_session(db, current_user.id, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    questions = (session.questions or {}).get("items", [])
    answers = (session.answers or {}).get("items", [])
    return InterviewCompleteResponse(
        id=session.id,
        job_title=session.job_title,
        experience_level=session.experience_level,
        interview_type=session.interview_type,
        language=session.language,
        question_count=session.question_count,
        questions=questions,
        answers=answers,
        overall_score=session.overall_score or 0.0,
        final_report=session.final_report or {},
        status=session.status,
        created_at=session.created_at,
    )

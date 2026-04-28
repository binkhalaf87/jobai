from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.models.user import User
from app.schemas.interview import (
    AnswerEvaluationResponse,
    AnswerSubmitRequest,
    InterviewCompleteResponse,
    InterviewContextSummary,
    InterviewListItem,
    InterviewQuestion,
    InterviewSessionResponse,
    InterviewSetupRequest,
)
from app.services.interview_service import (
    complete_session,
    create_session,
    evaluate_answer,
    get_session,
    list_sessions,
    stream_evaluate_answer,
)

router = APIRouter(prefix="/interviews", tags=["interviews"])


def _get_questions(session) -> list[dict]:
    return list((session.questions or {}).get("items", []))


def _get_answers(session) -> list[dict]:
    return list((session.answers or {}).get("items", []))


def _get_opening_message(session) -> str | None:
    return (session.questions or {}).get("opening_message")


def _get_context_summary(session) -> InterviewContextSummary | None:
    payload = (session.questions or {}).get("context_summary")
    return InterviewContextSummary.model_validate(payload) if payload else None


def _build_session_response(session) -> InterviewSessionResponse:
    return InterviewSessionResponse(
        id=session.id,
        job_title=session.job_title,
        experience_level=session.experience_level,
        interview_type=session.interview_type,
        language=session.language,
        question_count=session.question_count,
        questions=_get_questions(session),
        opening_message=_get_opening_message(session),
        context_summary=_get_context_summary(session),
        status=session.status,
        created_at=session.created_at,
    )


def _build_complete_response(session) -> InterviewCompleteResponse:
    return InterviewCompleteResponse(
        id=session.id,
        job_title=session.job_title,
        experience_level=session.experience_level,
        interview_type=session.interview_type,
        language=session.language,
        question_count=session.question_count,
        questions=_get_questions(session),
        answers=_get_answers(session),
        opening_message=_get_opening_message(session),
        context_summary=_get_context_summary(session),
        overall_score=session.overall_score or 0.0,
        final_report=session.final_report or {},
        status=session.status,
        created_at=session.created_at,
    )


@router.post("/sessions", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
def start_interview_session(
    payload: InterviewSetupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewSessionResponse:
    """Create a new interview session and generate the opening question via AI."""
    try:
        session = create_session(
            db=db,
            user_id=current_user.id,
            job_title=payload.job_title,
            experience_level=payload.experience_level,
            interview_type=payload.interview_type,
            language=payload.language,
            question_count=payload.question_count,
            resume_id=payload.resume_id,
            company_name=payload.company_name,
            job_description=payload.job_description,
            interviewer_style=payload.interviewer_style,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to generate interview questions. Please try again.",
        ) from exc

    return _build_session_response(session)


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
    """Submit a candidate answer, evaluate it, and generate the next question."""
    session = get_session(db, current_user.id, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    if session.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This session is already completed.",
        )

    try:
        evaluation_result = evaluate_answer(
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
        evaluation=evaluation_result["evaluation"],  # type: ignore[arg-type]
        questions=[
            InterviewQuestion.model_validate(question)
            for question in evaluation_result.get("questions", [])
        ],
        next_question=(
            InterviewQuestion.model_validate(evaluation_result["next_question"])
            if evaluation_result.get("next_question")
            else None
        ),
    )


@router.post(
    "/sessions/{session_id}/answer/stream",
    status_code=status.HTTP_200_OK,
)
def submit_answer_stream(
    session_id: str,
    payload: AnswerSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Stream the answer evaluation as Server-Sent Events."""
    session = get_session(db, current_user.id, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    if session.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This session is already completed.",
        )

    return StreamingResponse(
        stream_evaluate_answer(
            db=db,
            session=session,
            question_index=payload.question_index,
            question=payload.question,
            answer=payload.answer,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
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
        return _build_complete_response(session)

    try:
        session = complete_session(db, session)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to generate final report. Please try again.",
        ) from exc

    return _build_complete_response(session)


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

    return _build_complete_response(session)

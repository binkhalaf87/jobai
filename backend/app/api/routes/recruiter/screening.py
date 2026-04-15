"""Recruiter AI Screening — ranked candidates by job fit score with auto-shortlist."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_recruiter
from app.api.deps.db import get_db
from app.models.analysis import Analysis
from app.models.enums import AnalysisStatus, CandidateStage
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.models.user import User

router = APIRouter(prefix="/recruiter/screening", tags=["recruiter-screening"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class RankedCandidate(BaseModel):
    resume_id: str
    candidate_name: str
    email: str | None
    match_score: float
    matching_keywords: list[str]
    missing_keywords: list[str]
    hiring_suggestion: str | None
    stage: CandidateStage
    analysis_id: str
    analyzed_at: datetime | None


class RankedResultsResponse(BaseModel):
    job_id: str
    job_title: str
    candidates: list[RankedCandidate]


class AutoShortlistRequest(BaseModel):
    job_id: str
    min_score: float = 60.0


class AutoShortlistResponse(BaseModel):
    shortlisted: int
    already_shortlisted: int
    skipped: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_owned_job(db: Session, job_id: str, recruiter_id: str) -> JobDescription:
    job = db.get(JobDescription, job_id)
    if not job or job.user_id != recruiter_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return job


def _keywords_from_payload(payload: dict | None, key: str) -> list[str]:
    if not payload:
        return []
    value = payload.get(key, [])
    return [str(k) for k in value if k][:8] if isinstance(value, list) else []


def _hiring_suggestion_from_payload(payload: dict | None) -> str | None:
    if not payload:
        return None
    return payload.get("hiring_suggestion") or None


def _candidate_name(resume: Resume) -> str:
    if isinstance(resume.structured_data, dict):
        name = resume.structured_data.get("name")
        if name:
            return str(name)
    return resume.title


def _candidate_email(resume: Resume) -> str | None:
    if not isinstance(resume.structured_data, dict):
        return None
    contact = resume.structured_data.get("contact")
    if isinstance(contact, dict):
        return contact.get("email")
    return resume.structured_data.get("email")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/ranked", response_model=RankedResultsResponse)
def get_ranked_candidates(
    job_id: str,
    min_score: float = 0.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> RankedResultsResponse:
    """Return all candidates ranked by match score for a specific job."""
    job = _get_owned_job(db, job_id, current_user.id)

    analyses = list(
        db.scalars(
            select(Analysis)
            .where(
                Analysis.job_description_id == job_id,
                Analysis.status == AnalysisStatus.COMPLETED,
                Analysis.overall_score.is_not(None),
            )
            .order_by(Analysis.overall_score.desc())
        )
    )

    candidates: list[RankedCandidate] = []
    for analysis in analyses:
        resume = db.get(Resume, analysis.resume_id)
        if not resume or resume.user_id != current_user.id:
            continue
        score = float(analysis.overall_score)
        if score < min_score:
            continue
        payload = analysis.result_payload or {}
        candidates.append(
            RankedCandidate(
                resume_id=resume.id,
                candidate_name=_candidate_name(resume),
                email=_candidate_email(resume),
                match_score=score,
                matching_keywords=_keywords_from_payload(payload, "matching_keywords"),
                missing_keywords=_keywords_from_payload(payload, "missing_keywords"),
                hiring_suggestion=_hiring_suggestion_from_payload(payload),
                stage=resume.recruiter_stage,
                analysis_id=analysis.id,
                analyzed_at=analysis.completed_at,
            )
        )

    return RankedResultsResponse(
        job_id=job.id,
        job_title=job.title,
        candidates=candidates,
    )


@router.post("/auto-shortlist", response_model=AutoShortlistResponse)
def auto_shortlist(
    payload: AutoShortlistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> AutoShortlistResponse:
    """Promote candidates above min_score to the shortlisted stage for a given job."""
    job = _get_owned_job(db, payload.job_id, current_user.id)

    analyses = list(
        db.scalars(
            select(Analysis)
            .where(
                Analysis.job_description_id == job.id,
                Analysis.status == AnalysisStatus.COMPLETED,
                Analysis.overall_score >= payload.min_score,
                Analysis.overall_score.is_not(None),
            )
        )
    )

    shortlisted = 0
    already_shortlisted = 0
    skipped = 0

    for analysis in analyses:
        resume = db.get(Resume, analysis.resume_id)
        if not resume or resume.user_id != current_user.id:
            skipped += 1
            continue
        if resume.recruiter_stage == CandidateStage.SHORTLISTED:
            already_shortlisted += 1
            continue
        resume.recruiter_stage = CandidateStage.SHORTLISTED
        shortlisted += 1

    db.commit()

    return AutoShortlistResponse(
        shortlisted=shortlisted,
        already_shortlisted=already_shortlisted,
        skipped=skipped,
    )

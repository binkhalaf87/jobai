"""Talent Fit — candidate × job compatibility matrix."""

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_recruiter
from app.api.deps.db import get_db
from app.models.ai_report import AIAnalysisReport
from app.models.analysis import Analysis
from app.models.enums import AnalysisStatus, CandidateStage
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.models.user import User
from app.services.deep_match_report_service import REPORT_TYPE

router = APIRouter(prefix="/recruiter/talent-fit", tags=["recruiter-talent-fit"])


class TalentFitRow(BaseModel):
    resume_id: str
    candidate_name: str
    candidate_email: str | None
    candidate_stage: CandidateStage
    job_id: str
    job_title: str
    job_location: str | None
    overall_score: float
    matching_keywords: list[str]
    missing_keywords: list[str]
    hiring_suggestion: str | None
    analyzed_at: datetime | None
    report_id: str | None
    report_status: str | None


class TalentFitResponse(BaseModel):
    rows: list[TalentFitRow]
    total_candidates: int
    total_jobs: int


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


def _keywords(payload: dict | None, key: str) -> list[str]:
    if not payload:
        return []
    val = payload.get(key, [])
    return [str(k) for k in val if k][:8] if isinstance(val, list) else []


@router.get("/", response_model=TalentFitResponse)
def list_talent_fit(
    job_id: str | None = None,
    min_score: float = 0.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> TalentFitResponse:
    """Return all candidate × job pairs with match scores."""
    stmt = (
        select(Analysis)
        .where(
            Analysis.user_id == current_user.id,
            Analysis.status == AnalysisStatus.COMPLETED,
            Analysis.overall_score.is_not(None),
        )
        .order_by(Analysis.overall_score.desc())
    )
    if job_id:
        stmt = stmt.where(Analysis.job_description_id == job_id)

    analyses = list(db.scalars(stmt))

    # Pre-load all deep_match reports for this user
    existing_reports: dict[tuple[str, str], AIAnalysisReport] = {}
    all_reports = db.scalars(
        select(AIAnalysisReport)
        .where(
            AIAnalysisReport.user_id == current_user.id,
            AIAnalysisReport.report_type == REPORT_TYPE,
        )
    )
    for r in all_reports:
        if r.resume_id and r.job_description_id:
            existing_reports[(r.resume_id, r.job_description_id)] = r

    rows: list[TalentFitRow] = []
    seen_jobs: set[str] = set()
    seen_candidates: set[str] = set()

    for analysis in analyses:
        score = float(analysis.overall_score)
        if score < min_score:
            continue

        resume = db.get(Resume, analysis.resume_id)
        job = db.get(JobDescription, analysis.job_description_id)
        if not resume or not job:
            continue
        if resume.user_id != current_user.id or job.user_id != current_user.id:
            continue

        seen_candidates.add(resume.id)
        seen_jobs.add(job.id)

        payload = analysis.result_payload or {}
        existing = existing_reports.get((resume.id, job.id))

        rows.append(
            TalentFitRow(
                resume_id=resume.id,
                candidate_name=_candidate_name(resume),
                candidate_email=_candidate_email(resume),
                candidate_stage=resume.recruiter_stage,
                job_id=job.id,
                job_title=job.title,
                job_location=job.location_text,
                overall_score=score,
                matching_keywords=_keywords(payload, "matching_keywords"),
                missing_keywords=_keywords(payload, "missing_keywords"),
                hiring_suggestion=payload.get("hiring_suggestion"),
                analyzed_at=analysis.completed_at,
                report_id=existing.id if existing else None,
                report_status=existing.status if existing else None,
            )
        )

    return TalentFitResponse(
        rows=rows,
        total_candidates=len(seen_candidates),
        total_jobs=len(seen_jobs),
    )


@router.get("/jobs", response_model=list[dict])
def list_jobs_with_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> list[dict]:
    """Return jobs that have at least one completed analysis."""
    job_ids = db.scalars(
        select(Analysis.job_description_id)
        .where(
            Analysis.user_id == current_user.id,
            Analysis.status == AnalysisStatus.COMPLETED,
        )
        .distinct()
    )
    result = []
    for jid in job_ids:
        job = db.get(JobDescription, jid)
        if job and job.user_id == current_user.id:
            result.append({"id": job.id, "title": job.title})
    return result

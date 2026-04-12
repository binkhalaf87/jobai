from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_recruiter
from app.api.deps.db import get_db
from app.models.analysis import Analysis
from app.models.enums import AnalysisStatus
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.models.user import User

router = APIRouter(prefix="/recruiter/dashboard", tags=["recruiter-dashboard"])


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class TopMatch(BaseModel):
    candidate_name: str
    job_title: str
    score: float
    resume_id: str
    job_id: str


class RecentCandidate(BaseModel):
    resume_id: str
    title: str
    best_job: str | None
    best_score: float | None
    uploaded_at: datetime


class DashboardStats(BaseModel):
    total_candidates: int
    total_jobs: int
    avg_match_score: float
    top_matches: list[TopMatch]
    recent_candidates: list[RecentCandidate]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> DashboardStats:
    """Return aggregated dashboard statistics for the current recruiter."""
    recruiter_id = current_user.id

    # --- scalar aggregates (single query each) ---

    total_candidates: int = db.scalar(
        select(func.count(Resume.id)).where(Resume.user_id == recruiter_id)
    ) or 0

    total_jobs: int = db.scalar(
        select(func.count(JobDescription.id)).where(JobDescription.user_id == recruiter_id)
    ) or 0

    # Average score across all completed analyses whose job belongs to this recruiter
    avg_match_score: float = db.scalar(
        select(func.avg(Analysis.overall_score))
        .join(JobDescription, Analysis.job_description_id == JobDescription.id)
        .where(
            JobDescription.user_id == recruiter_id,
            Analysis.status == AnalysisStatus.COMPLETED,
            Analysis.overall_score.is_not(None),
        )
    ) or 0.0

    # --- top 5 resume-job pairs by score ---

    top_rows = db.execute(
        select(Analysis, Resume, JobDescription)
        .join(Resume, Analysis.resume_id == Resume.id)
        .join(JobDescription, Analysis.job_description_id == JobDescription.id)
        .where(
            Resume.user_id == recruiter_id,
            JobDescription.user_id == recruiter_id,
            Analysis.status == AnalysisStatus.COMPLETED,
            Analysis.overall_score.is_not(None),
        )
        .order_by(Analysis.overall_score.desc())
        .limit(5)
    ).all()

    top_matches = [
        TopMatch(
            candidate_name=resume.title,
            job_title=job.title,
            score=float(analysis.overall_score),
            resume_id=resume.id,
            job_id=job.id,
        )
        for analysis, resume, job in top_rows
    ]

    # --- last 5 resumes uploaded ---

    recent_resumes = list(
        db.scalars(
            select(Resume)
            .where(Resume.user_id == recruiter_id)
            .order_by(Resume.created_at.desc())
            .limit(5)
        )
    )

    recent_candidates: list[RecentCandidate] = []
    for resume in recent_resumes:
        best = db.execute(
            select(Analysis.overall_score, JobDescription.title)
            .join(JobDescription, Analysis.job_description_id == JobDescription.id)
            .where(
                Analysis.resume_id == resume.id,
                Analysis.status == AnalysisStatus.COMPLETED,
                Analysis.overall_score.is_not(None),
            )
            .order_by(Analysis.overall_score.desc())
            .limit(1)
        ).first()

        recent_candidates.append(
            RecentCandidate(
                resume_id=resume.id,
                title=resume.title,
                best_job=best.title if best else None,
                best_score=float(best.overall_score) if best else None,
                uploaded_at=resume.created_at,
            )
        )

    return DashboardStats(
        total_candidates=total_candidates,
        total_jobs=total_jobs,
        avg_match_score=round(float(avg_match_score), 2),
        top_matches=top_matches,
        recent_candidates=recent_candidates,
    )

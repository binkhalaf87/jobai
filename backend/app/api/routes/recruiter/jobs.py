from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_recruiter
from app.api.deps.db import get_db
from app.models.analysis import Analysis
from app.models.enums import AnalysisStatus, EmploymentType
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.models.user import User

router = APIRouter(prefix="/recruiter/jobs", tags=["recruiter-jobs"])


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------


class RecruiterJobCreate(BaseModel):
    title: str
    company_name: str | None = None
    description: str
    location: str | None = None
    employment_type: EmploymentType | None = None
    required_skills: list[str] | None = None
    years_experience_min: int | None = None


class RecruiterJobUpdate(BaseModel):
    title: str
    description: str
    company_name: str | None = None
    location: str | None = None
    employment_type: EmploymentType | None = None
    required_skills: list[str] | None = None
    years_experience_min: int | None = None


class RecruiterJobListItem(BaseModel):
    id: str
    title: str
    company_name: str | None
    location: str | None
    employment_type: EmploymentType | None
    created_at: datetime
    candidate_count: int
    description: str | None
    required_skills: list[str] | None = None
    years_experience_min: int | None = None

    model_config = {"from_attributes": True}


class CandidateSummary(BaseModel):
    resume_id: str
    candidate_name: str
    overall_score: float | None
    matching_keywords: list[str]
    missing_keywords: list[str]
    ai_summary: str | None


class RecruiterJobDetail(BaseModel):
    id: str
    title: str
    company_name: str | None
    location: str | None
    employment_type: EmploymentType | None
    created_at: datetime
    top_candidates: list[CandidateSummary]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_owned_job(db: Session, job_id: str, recruiter_id: str) -> JobDescription:
    """Return the job if it exists and belongs to this recruiter, else 404."""
    job = db.get(JobDescription, job_id)
    if not job or job.user_id != recruiter_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return job


def _extract_keywords(payload: dict | None, key: str) -> list[str]:
    """Pull a keyword list from result_payload, tolerating missing or malformed data."""
    if not payload:
        return []
    value = payload.get(key, [])
    if isinstance(value, list):
        return [str(k) for k in value if k]
    return []


def _extract_ai_summary(analysis: Analysis) -> str | None:
    """Return a one-sentence summary extracted from result_payload or summary_text."""
    payload = analysis.result_payload or {}

    for key in ("summary", "overall_summary", "fit_summary", "overview"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            sentence = value.strip().split(".")[0]
            return sentence + "." if not sentence.endswith(".") else sentence

    if analysis.summary_text:
        sentence = analysis.summary_text.strip().split(".")[0]
        return sentence + "." if not sentence.endswith(".") else sentence

    return None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=RecruiterJobListItem)
def create_job(
    payload: RecruiterJobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> RecruiterJobListItem:
    """Create a new job posting owned by the current recruiter."""
    # Build enriched description for AI matching
    enriched = payload.description
    if payload.required_skills:
        enriched += f"\n\nRequired Skills: {', '.join(payload.required_skills)}"
    if payload.years_experience_min is not None:
        enriched += f"\nMinimum Years of Experience: {payload.years_experience_min}"

    kw_data: dict = {}
    if payload.required_skills:
        kw_data["required_skills"] = payload.required_skills
    if payload.years_experience_min is not None:
        kw_data["years_experience_min"] = payload.years_experience_min

    job = JobDescription(
        user_id=current_user.id,
        title=payload.title,
        company_name=payload.company_name,
        source_text=enriched,
        location_text=payload.location,
        employment_type=payload.employment_type,
        keyword_data=kw_data or None,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return RecruiterJobListItem(
        id=job.id,
        title=job.title,
        company_name=job.company_name,
        location=job.location_text,
        employment_type=job.employment_type,
        created_at=job.created_at,
        candidate_count=0,
        description=payload.description,
        required_skills=payload.required_skills,
        years_experience_min=payload.years_experience_min,
    )


@router.get("/", response_model=list[RecruiterJobListItem])
def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> list[RecruiterJobListItem]:
    """List all job postings created by the current recruiter with candidate counts."""
    count_sub = (
        select(Analysis.job_description_id, func.count(Analysis.id).label("cnt"))
        .where(Analysis.status == AnalysisStatus.COMPLETED)
        .group_by(Analysis.job_description_id)
        .subquery()
    )

    rows = db.execute(
        select(JobDescription, func.coalesce(count_sub.c.cnt, 0).label("candidate_count"))
        .outerjoin(count_sub, JobDescription.id == count_sub.c.job_description_id)
        .where(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
    ).all()

    result = []
    for job, count in rows:
        kd = job.keyword_data or {}
        # Strip appended skills/experience lines from displayed description
        desc = job.source_text or ""
        if "\n\nRequired Skills:" in desc:
            desc = desc.split("\n\nRequired Skills:")[0]
        result.append(RecruiterJobListItem(
            id=job.id,
            title=job.title,
            company_name=job.company_name,
            location=job.location_text,
            employment_type=job.employment_type,
            created_at=job.created_at,
            candidate_count=int(count),
            description=desc,
            required_skills=kd.get("required_skills"),
            years_experience_min=kd.get("years_experience_min"),
        ))
    return result


@router.get("/{job_id}", response_model=RecruiterJobDetail)
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> RecruiterJobDetail:
    """Return a job posting with its top 5 candidates ranked by overall score."""
    job = _get_owned_job(db, job_id, current_user.id)

    top_analyses = db.scalars(
        select(Analysis)
        .where(
            Analysis.job_description_id == job_id,
            Analysis.status == AnalysisStatus.COMPLETED,
            Analysis.overall_score.is_not(None),
        )
        .order_by(Analysis.overall_score.desc())
        .limit(5)
    ).all()

    candidates: list[CandidateSummary] = []
    for analysis in top_analyses:
        resume = db.get(Resume, analysis.resume_id)
        if not resume:
            continue

        payload = analysis.result_payload or {}
        matching = _extract_keywords(payload, "matching_keywords")
        missing = _extract_keywords(payload, "missing_keywords")

        candidates.append(
            CandidateSummary(
                resume_id=resume.id,
                candidate_name=resume.title,
                overall_score=float(analysis.overall_score) if analysis.overall_score is not None else None,
                matching_keywords=matching,
                missing_keywords=missing,
                ai_summary=_extract_ai_summary(analysis),
            )
        )

    return RecruiterJobDetail(
        id=job.id,
        title=job.title,
        company_name=job.company_name,
        location=job.location_text,
        employment_type=job.employment_type,
        created_at=job.created_at,
        top_candidates=candidates,
    )


@router.patch("/{job_id}", response_model=RecruiterJobListItem)
def update_job(
    job_id: str,
    payload: RecruiterJobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> RecruiterJobListItem:
    """Update an existing job posting."""
    job = _get_owned_job(db, job_id, current_user.id)
    job.title = payload.title.strip()
    job.company_name = payload.company_name.strip() if payload.company_name else None
    job.location_text = payload.location.strip() if payload.location else None
    job.employment_type = payload.employment_type

    # Rebuild enriched source_text for AI matching
    enriched = payload.description.strip()
    if payload.required_skills:
        enriched += f"\n\nRequired Skills: {', '.join(payload.required_skills)}"
    if payload.years_experience_min is not None:
        enriched += f"\nMinimum Years of Experience: {payload.years_experience_min}"
    job.source_text = enriched

    kw_data: dict = dict(job.keyword_data or {})
    if payload.required_skills is not None:
        kw_data["required_skills"] = payload.required_skills
    if payload.years_experience_min is not None:
        kw_data["years_experience_min"] = payload.years_experience_min
    job.keyword_data = kw_data or None

    db.commit()
    db.refresh(job)

    count = db.scalar(
        select(func.count(Analysis.id))
        .where(Analysis.job_description_id == job_id, Analysis.status == AnalysisStatus.COMPLETED)
    ) or 0

    kd = job.keyword_data or {}
    return RecruiterJobListItem(
        id=job.id,
        title=job.title,
        company_name=job.company_name,
        location=job.location_text,
        employment_type=job.employment_type,
        created_at=job.created_at,
        candidate_count=int(count),
        description=payload.description.strip(),
        required_skills=kd.get("required_skills"),
        years_experience_min=kd.get("years_experience_min"),
    )


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> None:
    """Delete a job posting owned by the current recruiter."""
    job = _get_owned_job(db, job_id, current_user.id)
    db.delete(job)
    db.commit()

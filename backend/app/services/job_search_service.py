"""Service layer for JSearch job search proxy and saved-job management."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.resume import Resume
from app.models.saved_job import SavedJob
from app.schemas.job_search import JobResult
from app.services.analysis_matching import compute_match_result

logger = logging.getLogger(__name__)

JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com"
JSEARCH_HOST = "jsearch.p.rapidapi.com"
JSEARCH_TIMEOUT = 15.0  # seconds
JSEARCH_NUM_PAGES = 1


# ─── JSearch proxy ────────────────────────────────────────────────────────────

def _jsearch_headers() -> dict[str, str]:
    settings = get_settings()
    if not settings.rapidapi_key:
        raise RuntimeError("RAPIDAPI_KEY is not configured in environment variables.")
    return {
        "X-RapidAPI-Key": settings.rapidapi_key,
        "X-RapidAPI-Host": JSEARCH_HOST,
    }


def _parse_location(job: dict[str, Any]) -> str | None:
    parts = [job.get("job_city"), job.get("job_state"), job.get("job_country")]
    filtered = [p for p in parts if p]
    return ", ".join(filtered) if filtered else None


def _parse_employment_type(raw: str | None) -> str | None:
    if not raw:
        return None
    mapping = {
        "FULLTIME":   "Full-time",
        "PARTTIME":   "Part-time",
        "CONTRACTOR": "Contract",
        "INTERN":     "Internship",
    }
    return mapping.get(raw.upper(), raw.title())


def _parse_source(job: dict[str, Any]) -> str | None:
    publisher = job.get("job_publisher")
    if publisher:
        return publisher
    link = job.get("job_apply_link", "")
    for known in ("linkedin", "indeed", "glassdoor", "ziprecruiter", "monster", "bayt", "naukri"):
        if known in link.lower():
            return known.capitalize()
    return None


def _raw_to_job_result(job: dict[str, Any]) -> JobResult:
    """Map a raw JSearch API job object to our internal JobResult schema."""
    return JobResult(
        job_id=str(job.get("job_id", "")),
        job_title=str(job.get("job_title", "")),
        company_name=str(job.get("employer_name", "")),
        employer_logo=job.get("employer_logo"),
        location=_parse_location(job),
        employment_type=_parse_employment_type(job.get("job_employment_type")),
        job_description=job.get("job_description"),
        apply_link=job.get("job_apply_link"),
        salary_min=job.get("job_min_salary") or job.get("job_salary_min"),
        salary_max=job.get("job_max_salary") or job.get("job_salary_max"),
        salary_currency=job.get("job_salary_currency"),
        source=_parse_source(job),
        posted_at=job.get("job_posted_at_datetime_utc"),
    )


def search_jobs(
    query: str,
    location: str = "",
    page: int = 1,
    date_posted: str = "all",
    employment_type: str = "",
) -> tuple[list[JobResult], int]:
    """
    Call JSearch RapidAPI and return (job_results, total_found).
    Raises RuntimeError if the API key is missing.
    Raises httpx.HTTPError on network / API failures.
    """
    full_query = f"{query} {location}".strip() if location else query

    params: dict[str, Any] = {
        "query": full_query,
        "page": str(page),
        "num_pages": str(JSEARCH_NUM_PAGES),
    }
    if date_posted and date_posted != "all":
        params["date_posted"] = date_posted
    if employment_type:
        params["employment_types"] = employment_type

    with httpx.Client(timeout=JSEARCH_TIMEOUT) as client:
        response = client.get(
            f"{JSEARCH_BASE_URL}/search",
            params=params,
            headers=_jsearch_headers(),
        )
        response.raise_for_status()

    data = response.json()
    raw_jobs: list[dict[str, Any]] = data.get("data", [])
    total = int(data.get("estimated_results", len(raw_jobs)))

    results = [_raw_to_job_result(j) for j in raw_jobs]
    return results, total


# ─── AI Fit Score ─────────────────────────────────────────────────────────────

def attach_fit_scores(
    db: Session,
    user_id: str,
    resume_id: str,
    jobs: list[JobResult],
) -> list[JobResult]:
    """
    Compute TF-IDF fit scores between the user's resume and each job description.
    Jobs without a description get fit_score=None.
    """
    resume: Resume | None = db.scalar(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
    )
    if not resume or not resume.raw_text:
        return jobs

    resume_text = resume.raw_text
    for job in jobs:
        if not job.job_description:
            continue
        try:
            result = compute_match_result(resume_text, job.job_description)
            job.fit_score = result.match_score
        except Exception:
            logger.debug("Fit score failed for job %s", job.job_id, exc_info=True)

    return jobs


# ─── Saved-job CRUD ───────────────────────────────────────────────────────────

def get_saved_job_ids(db: Session, user_id: str) -> set[str]:
    """Return the set of external job_ids the user has already saved."""
    rows = db.scalars(
        select(SavedJob.job_id).where(SavedJob.user_id == user_id)
    )
    return set(rows)


def save_job(db: Session, user_id: str, payload: dict[str, Any]) -> SavedJob:
    """Upsert a job into saved_jobs (idempotent — re-saving has no effect)."""
    # Check for duplicate
    existing = db.scalar(
        select(SavedJob).where(
            SavedJob.user_id == user_id,
            SavedJob.job_id == payload["job_id"],
        )
    )
    if existing:
        return existing

    posted_at: datetime | None = None
    raw_posted = payload.get("posted_at")
    if raw_posted:
        try:
            posted_at = datetime.fromisoformat(raw_posted.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            pass

    saved = SavedJob(
        user_id=user_id,
        job_id=payload["job_id"],
        job_title=payload["job_title"],
        company_name=payload["company_name"],
        employer_logo=payload.get("employer_logo"),
        location=payload.get("location"),
        employment_type=payload.get("employment_type"),
        job_description=payload.get("job_description"),
        apply_link=payload.get("apply_link"),
        salary_min=payload.get("salary_min"),
        salary_max=payload.get("salary_max"),
        salary_currency=payload.get("salary_currency"),
        source=payload.get("source"),
        fit_score=payload.get("fit_score"),
        posted_at=posted_at,
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved


def unsave_job(db: Session, user_id: str, saved_job_id: str) -> bool:
    """Delete a saved job. Returns True if it existed, False otherwise."""
    row = db.scalar(
        select(SavedJob).where(
            SavedJob.id == saved_job_id,
            SavedJob.user_id == user_id,
        )
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


def unsave_job_by_external_id(db: Session, user_id: str, job_id: str) -> bool:
    """Delete a saved job by its external JSearch job_id."""
    row = db.scalar(
        select(SavedJob).where(
            SavedJob.job_id == job_id,
            SavedJob.user_id == user_id,
        )
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


def list_saved_jobs(db: Session, user_id: str) -> list[SavedJob]:
    """Return all saved jobs for a user, newest first."""
    return list(
        db.scalars(
            select(SavedJob)
            .where(SavedJob.user_id == user_id)
            .order_by(SavedJob.created_at.desc())
        )
    )

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.models.user import User
from app.schemas.job_search import (
    JobSearchResponse,
    SaveJobRequest,
    SavedJobResponse,
)
from app.services.job_search_service import (
    attach_fit_scores,
    get_saved_job_ids,
    list_saved_jobs,
    save_job,
    search_jobs,
    unsave_job,
    unsave_job_by_external_id,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/search", response_model=JobSearchResponse)
def search_job_listings(
    q: str = Query(..., description="Job title or keywords"),
    location: str = Query("", description="City, country, or region"),
    page: int = Query(1, ge=1, le=10),
    date_posted: str = Query("all", description="all | today | 3days | week | month"),
    employment_type: str = Query("", description="FULLTIME | PARTTIME | CONTRACTOR | INTERN"),
    resume_id: str | None = Query(None, description="Resume ID for AI fit scoring"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JobSearchResponse:
    """
    Proxy to JSearch RapidAPI.
    Optionally computes AI fit scores when resume_id is provided.
    Marks saved status for jobs the user already bookmarked.
    """
    if not q.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Search query is required.")

    try:
        jobs, total = search_jobs(
            query=q.strip(),
            location=location.strip(),
            page=page,
            date_posted=date_posted,
            employment_type=employment_type,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Job search service is currently unavailable. Please try again.",
        ) from exc

    # Compute fit scores if a resume is selected
    if resume_id and jobs:
        jobs = attach_fit_scores(db, current_user.id, resume_id, jobs)

    # Mark already-saved jobs
    saved_ids = get_saved_job_ids(db, current_user.id)
    for job in jobs:
        job.is_saved = job.job_id in saved_ids

    return JobSearchResponse(
        query=q.strip(),
        location=location.strip(),
        page=page,
        total_found=total,
        results=jobs,
    )


@router.post("/saved", response_model=SavedJobResponse, status_code=status.HTTP_201_CREATED)
def bookmark_job(
    payload: SaveJobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavedJobResponse:
    """Save a job to the user's bookmarks. Idempotent — re-saving has no effect."""
    saved = save_job(db, current_user.id, payload.model_dump())
    return saved  # type: ignore[return-value]


@router.delete("/saved/by-job-id/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def unbookmark_job_by_external_id(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove a job from bookmarks using the external JSearch job_id."""
    found = unsave_job_by_external_id(db, current_user.id, job_id)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved job not found.")


@router.delete("/saved/{saved_job_id}", status_code=status.HTTP_204_NO_CONTENT)
def unbookmark_job(
    saved_job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove a job from bookmarks using the internal saved-job UUID."""
    found = unsave_job(db, current_user.id, saved_job_id)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved job not found.")


@router.get("/saved", response_model=list[SavedJobResponse])
def get_saved_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SavedJobResponse]:
    """Return all bookmarked jobs for the current user, newest first."""
    return list_saved_jobs(db, current_user.id)  # type: ignore[return-value]

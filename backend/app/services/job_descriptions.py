from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.job_description import JobDescription
from app.models.user import User
from app.schemas.job_description import JobDescriptionCreate
from app.services.job_description_keywords import extract_job_description_keywords
from app.services.text_normalization import normalize_text_content


def create_job_description(db: Session, user: User, payload: JobDescriptionCreate) -> JobDescription:
    """Normalize and persist a job description record for later analysis."""
    normalized_text = normalize_text_content(payload.source_text)

    title = payload.title.strip() or "Untitled role"
    company_name = payload.company_name.strip() if payload.company_name else None
    source_url = payload.source_url.strip() if payload.source_url else None
    location_text = payload.location_text.strip() if payload.location_text else None
    keyword_data = extract_job_description_keywords(title, normalized_text).to_dict()

    job_description = JobDescription(
        user_id=user.id,
        title=title,
        company_name=company_name,
        source_url=source_url,
        source_text=payload.source_text,
        normalized_text=normalized_text,
        keyword_data=keyword_data,
        employment_type=payload.employment_type,
        location_text=location_text,
    )
    db.add(job_description)
    db.commit()
    db.refresh(job_description)
    return job_description


def list_user_job_descriptions(db: Session, user_id: str) -> list[JobDescription]:
    """Return all job descriptions for a user, newest first."""
    return list(
        db.scalars(
            select(JobDescription)
            .where(JobDescription.user_id == user_id)
            .order_by(JobDescription.created_at.desc())
        )
    )


def ensure_job_description_keywords(db: Session, job_description: JobDescription) -> JobDescription:
    """Populate keyword data on an existing job description when it is missing."""
    if job_description.keyword_data:
        return job_description

    normalized_text = job_description.normalized_text or normalize_text_content(job_description.source_text)
    keyword_data = extract_job_description_keywords(job_description.title, normalized_text).to_dict()

    job_description.normalized_text = normalized_text
    job_description.keyword_data = keyword_data
    db.add(job_description)
    db.commit()
    db.refresh(job_description)
    return job_description

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resume import Resume

TEXT_PREVIEW_LIMIT = 1200


def get_user_resume(db: Session, user_id: str, resume_id: str) -> Resume | None:
    """Load a resume that belongs to the current user."""
    statement = select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
    return db.scalar(statement)


def build_text_preview(text: str | None, limit: int = TEXT_PREVIEW_LIMIT) -> str:
    """Trim stored text into a readable preview for API responses."""
    if not text:
        return ""

    preview = text[:limit].strip()
    return f"{preview}..." if len(text) > limit else preview

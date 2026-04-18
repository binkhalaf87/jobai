"""Resume upload service.

Two-phase design
----------------
1. ``store_resume`` (fast, called inside the HTTP request)
   Reads + validates the file, writes it to storage, and inserts a DB record
   with status UPLOADED.  Returns immediately so the client gets a quick 201.

2. ``process_resume_text_task`` (slow, runs as a BackgroundTask)
   Opens its own DB session, fetches the stored file, extracts text with
   PyMuPDF / python-docx, parses structured data, then updates the record
   to PARSED (or FAILED on error).  The client polls the status via GET.
"""
from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.enums import ResumeProcessingStatus
from app.models.resume import Resume
from app.models.user import User
from app.services.resume_extraction import extract_resume_text
from app.services.storage import get_storage
from app.utils.files import validate_resume_file

logger = logging.getLogger(__name__)

_CONTENT_TYPES: dict[str, str] = {
    "pdf":  "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc":  "application/msword",
}


# ---------------------------------------------------------------------------
# Phase 1 — store (called in the HTTP request)
# ---------------------------------------------------------------------------

async def store_resume(
    db: Session,
    user: User,
    uploaded_file: UploadFile,
    *,
    auto_commit: bool = True,
) -> Resume:
    """Validate and persist the uploaded file; return a Resume with UPLOADED status.

    Text extraction is intentionally deferred to ``process_resume_text_task``
    so that the HTTP response is not blocked by slow PDF/DOCX parsing.
    """
    original_name = uploaded_file.filename or "resume"
    file_bytes = await uploaded_file.read()

    # Full validation: extension + content-type + magic bytes + size
    suffix = validate_resume_file(original_name, uploaded_file.content_type, file_bytes)

    resume_id = str(uuid4())
    storage_key = f"{resume_id}{suffix}"
    content_type = _CONTENT_TYPES.get(suffix.lstrip("."), "application/octet-stream")
    storage = get_storage()

    try:
        storage.upload(storage_key, file_bytes, content_type)

        resume = Resume(
            id=resume_id,
            user_id=user.id,
            title=Path(original_name).stem,
            source_filename=original_name,
            file_type=suffix.lstrip("."),
            storage_key=storage_key,
            processing_status=ResumeProcessingStatus.UPLOADED,
        )
        db.add(resume)
        if auto_commit:
            db.commit()
            db.refresh(resume)
        else:
            db.flush()
        return resume

    except Exception:
        storage.delete(storage_key)
        db.rollback()
        raise

    finally:
        await uploaded_file.close()


# ---------------------------------------------------------------------------
# Phase 2 — extract (shared helper, caller owns session + commit)
# ---------------------------------------------------------------------------

def _apply_resume_text(db: Session, resume: Resume) -> None:
    """Populate text fields on *resume* using the caller's existing session.

    Does not commit — the caller decides when to persist the changes.
    Raises on extraction failure so the caller can handle the error.
    """
    storage = get_storage()
    suffix = f".{resume.file_type or 'pdf'}"

    local_path = storage.get_local_path(resume.storage_key)
    if local_path is not None:
        extracted = extract_resume_text(local_path, suffix)
    else:
        file_bytes = storage.download(resume.storage_key)
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = Path(tmp.name)
        try:
            extracted = extract_resume_text(tmp_path, suffix)
        finally:
            tmp_path.unlink(missing_ok=True)

    resume.raw_text = extracted.raw_text
    resume.normalized_text = extracted.normalized_text
    resume.structured_data = extracted.structured_data
    resume.page_count = extracted.page_count
    resume.processing_status = ResumeProcessingStatus.PARSED


def process_resume_text_task(resume_id: str) -> None:
    """Extract and parse resume text, then update the DB record.

    This runs *after* the HTTP response has been sent, so it must open its
    own database session and must not raise — errors are caught and stored
    as FAILED status on the resume record.
    """
    from app.db.session import SessionLocal  # local import avoids circular deps

    db: Session = SessionLocal()
    resume: Resume | None = None

    try:
        resume = db.get(Resume, resume_id)
        if not resume or not resume.storage_key:
            return

        resume.processing_status = ResumeProcessingStatus.PROCESSING
        db.commit()

        _apply_resume_text(db, resume)
        db.commit()

    except Exception:
        logger.exception("Background text extraction failed for resume %s", resume_id)
        try:
            db.rollback()
            if resume is not None:
                resume.processing_status = ResumeProcessingStatus.FAILED
                db.commit()
        except Exception:
            logger.exception("Failed to mark resume %s as FAILED", resume_id)

    finally:
        db.close()


# ---------------------------------------------------------------------------
# Legacy shim — keeps existing callers (recruiter upload, tests) working
# ---------------------------------------------------------------------------

async def save_resume_upload(
    db: Session,
    user: User,
    uploaded_file: UploadFile,
    *,
    auto_commit: bool = True,
) -> Resume:
    """Store + extract synchronously.

    Used by the recruiter bulk-upload flow where the caller manages its own
    transaction (auto_commit=False).  For the jobseeker single-file endpoint
    prefer ``store_resume`` + ``process_resume_text_task``.
    """
    resume = await store_resume(db, user, uploaded_file, auto_commit=False)
    # Extract text in the same session so the row is visible before commit.
    try:
        resume.processing_status = ResumeProcessingStatus.PROCESSING
        _apply_resume_text(db, resume)
    except Exception:
        logger.exception("Inline text extraction failed for resume %s", resume.id)
        resume.processing_status = ResumeProcessingStatus.FAILED
    if auto_commit:
        db.commit()
        db.refresh(resume)
    return resume

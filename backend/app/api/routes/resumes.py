from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.core.rate_limit import limiter
from app.models.user import User
from app.schemas.resume import ResumeListItem, ResumeTextPreviewResponse, ResumeUploadResponse
from app.services.resume_preview import build_text_preview, get_user_resume, list_user_resumes
from app.services.resume_upload import process_resume_text_task, store_resume
from app.services.storage import get_storage

# This router keeps resume ingestion separate from downstream analysis logic.
router = APIRouter(prefix="/resume", tags=["resume"])


_MIME_TYPES: dict[str, str] = {
    "pdf":  "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc":  "application/msword",
}


@router.get("/status")
def resumes_status() -> dict[str, str]:
    """Placeholder endpoint confirming the resumes route group is wired."""
    return {"status": "resume routes ready"}


@router.get("/", response_model=list[ResumeListItem])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ResumeListItem]:
    """Return all resumes belonging to the authenticated user, newest first."""
    return list_user_resumes(db, current_user.id)


@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/hour")
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResumeUploadResponse:
    """Store the resume file and return immediately; text extraction runs in the background.

    Poll GET /resume/{resume_id} to check when processing_status reaches 'parsed'.
    """
    try:
        resume = await store_resume(db, current_user, file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    background_tasks.add_task(process_resume_text_task, resume.id)
    return ResumeUploadResponse(resume_id=resume.id)


@router.get("/{resume_id}", response_model=ResumeTextPreviewResponse)
def get_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResumeTextPreviewResponse:
    """Return a preview of the extracted resume text for the current user."""
    resume = get_user_resume(db, current_user.id, resume_id)

    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    return ResumeTextPreviewResponse(
        id=resume.id,
        title=resume.title,
        source_filename=resume.source_filename,
        processing_status=resume.processing_status,
        raw_text_preview=build_text_preview(resume.raw_text),
        normalized_text_preview=build_text_preview(resume.normalized_text),
        structured_data=resume.structured_data,
    )


@router.get("/{resume_id}/file")
def get_resume_file(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse | RedirectResponse:
    """Stream or redirect to the original uploaded resume file.

    - Local backend  → streams the file directly via FileResponse.
    - Cloud backend  → returns a 307 redirect to a pre-signed URL (1-hour TTL).
    """
    resume = get_user_resume(db, current_user.id, resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    storage = get_storage()
    key = resume.storage_key or ""

    # Cloud path — pre-signed URL redirect
    url = storage.get_download_url(key, expires_in=3600)
    if url:
        return RedirectResponse(url=url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    # Local path — direct streaming
    local_path = storage.get_local_path(key)
    if not local_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found.")

    media_type = _MIME_TYPES.get(resume.file_type or "", "application/octet-stream")
    filename = resume.source_filename or f"{resume_id}.{resume.file_type or 'bin'}"
    return FileResponse(path=str(local_path), media_type=media_type, filename=filename)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a resume owned by the current user. Associated analyses are also removed."""
    resume = get_user_resume(db, current_user.id, resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    storage_key = resume.storage_key
    db.delete(resume)
    db.commit()
    get_storage().delete(storage_key or "")

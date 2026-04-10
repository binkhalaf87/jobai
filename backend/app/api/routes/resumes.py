from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.models.user import User
from app.schemas.resume import ResumeListItem, ResumeTextPreviewResponse, ResumeUploadResponse
from app.services.resume_preview import build_text_preview, get_user_resume, list_user_resumes
from app.services.resume_upload import save_resume_upload

# This router keeps resume ingestion separate from downstream analysis logic.
router = APIRouter(prefix="/resume", tags=["resume"])


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
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResumeUploadResponse:
    """Accept a resume document, validate it, and store it temporarily for later processing."""
    try:
        resume = await save_resume_upload(db, current_user, file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

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

    db.delete(resume)
    db.commit()

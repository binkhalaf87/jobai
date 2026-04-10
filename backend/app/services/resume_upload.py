from pathlib import Path
from tempfile import gettempdir
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.models.user import User
from app.models.enums import ResumeProcessingStatus
from app.services.resume_extraction import extract_resume_text
from app.services.resume_parser import parse_resume_text
from app.utils.files import validate_resume_file

TEMP_UPLOAD_DIR = Path(gettempdir()) / "jobai" / "resumes"


def _build_temp_path(resume_id: str, suffix: str) -> Path:
    """Build a predictable temporary storage path for an uploaded resume file."""
    TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return TEMP_UPLOAD_DIR / f"{resume_id}{suffix}"


async def save_resume_upload(db: Session, user: User, uploaded_file: UploadFile) -> Resume:
    """Validate, store, and extract text from an uploaded resume."""
    original_name = uploaded_file.filename or "resume"
    suffix = validate_resume_file(original_name, uploaded_file.content_type)
    resume_id = str(uuid4())
    temp_path = _build_temp_path(resume_id, suffix)

    try:
        file_bytes = await uploaded_file.read()
        temp_path.write_bytes(file_bytes)

        try:
            extracted_content = extract_resume_text(temp_path, suffix)
        except Exception as exc:
            raise ValueError("Unable to extract text from the uploaded file.") from exc
        structured_resume = parse_resume_text(extracted_content.normalized_text)

        resume = Resume(
            id=resume_id,
            user_id=user.id,
            title=Path(original_name).stem,
            source_filename=original_name,
            file_type=suffix.lstrip("."),
            storage_key=str(temp_path),
            raw_text=extracted_content.raw_text,
            normalized_text=extracted_content.normalized_text,
            structured_data=structured_resume.to_dict(),
            page_count=extracted_content.page_count,
            processing_status=ResumeProcessingStatus.PARSED,
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume
    except Exception:
        if temp_path.exists():
            temp_path.unlink()
        db.rollback()
        raise
    finally:
        await uploaded_file.close()

from pathlib import Path


ALLOWED_RESUME_TYPES = {
    ".pdf": {"application/pdf"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
}


def validate_resume_file(filename: str, content_type: str | None) -> str:
    """Validate that an uploaded resume is a supported PDF or DOCX document."""
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_RESUME_TYPES:
        raise ValueError("Only PDF and DOCX files are supported.")

    allowed_content_types = ALLOWED_RESUME_TYPES[suffix]
    normalized_content_type = (content_type or "").lower().strip()

    if normalized_content_type and normalized_content_type not in allowed_content_types:
        raise ValueError("The uploaded file type does not match the expected document format.")

    return suffix

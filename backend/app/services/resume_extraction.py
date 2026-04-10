from dataclasses import dataclass
from pathlib import Path

import fitz
from docx import Document

from app.services.text_normalization import normalize_text_content


@dataclass(frozen=True)
class ExtractedResumeContent:
    """Structured result returned by the resume extraction service."""

    raw_text: str
    normalized_text: str
    page_count: int | None = None

def extract_pdf_text(file_path: Path) -> ExtractedResumeContent:
    """Extract text from a PDF document using PyMuPDF."""
    with fitz.open(file_path) as document:
        pages = [page.get_text("text") for page in document]
        raw_text = "\n".join(page.strip() for page in pages if page.strip())
        return ExtractedResumeContent(
            raw_text=raw_text,
            normalized_text=normalize_text_content(raw_text),
            page_count=document.page_count,
        )


def extract_docx_text(file_path: Path) -> ExtractedResumeContent:
    """Extract text from a DOCX document using python-docx."""
    document = Document(file_path)
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    raw_text = "\n".join(paragraphs)
    return ExtractedResumeContent(
        raw_text=raw_text,
        normalized_text=normalize_text_content(raw_text),
        page_count=len(document.sections) or None,
    )


def extract_resume_text(file_path: Path, suffix: str) -> ExtractedResumeContent:
    """Extract text from a supported resume file type."""
    normalized_suffix = suffix.lower()

    if normalized_suffix == ".pdf":
        return extract_pdf_text(file_path)

    if normalized_suffix == ".docx":
        return extract_docx_text(file_path)

    raise ValueError("Unsupported file type for text extraction.")

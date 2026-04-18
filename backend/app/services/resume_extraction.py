"""GPT-powered resume extraction — PDF pages → Vision, DOCX → text, both return structured data."""

from __future__ import annotations

import base64
import json
import logging
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import fitz          # PyMuPDF — renders PDF pages to PNG images
from docx import Document

from app.core.openai_client import get_openai_client
from app.services.rewrite_engine import get_rewrite_model_name

logger = logging.getLogger(__name__)

_VISION_ZOOM = 1.5   # render quality: ~400 KB/page
_MAX_PAGES = 4       # first 4 pages cover virtually all resumes

_SYSTEM_PROMPT = """\
You are an expert resume parser. Extract ALL information from the resume and return ONLY valid JSON with this exact shape:

{
  "raw_text": "full plain-text content of the entire resume, preserving line breaks",
  "name": "candidate full name or null",
  "email": "email address or null",
  "phone": "phone number or null",
  "summary": "professional summary / objective paragraph or null",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    "Job Title at Company Name (StartDate – EndDate): key responsibilities and achievements"
  ],
  "education": [
    "Degree, Institution Name, Year"
  ],
  "languages": ["Language (Proficiency)", ...],
  "certifications": ["Certification Name, Issuer, Year", ...]
}

Rules:
- raw_text: the complete readable text of the resume — do not omit anything.
- skills: deduplicated, concise, include both technical and soft skills.
- experience: each entry is a single readable string. If dates are unclear write "Unknown".
- education: each entry is a single readable string.
- languages / certifications: empty arrays if none found.
- Return null for missing scalar fields — never an empty string.
- Respond with JSON only — no markdown, no extra text.
"""


@dataclass
class ExtractedResumeContent:
    """Full extraction result combining raw text and GPT-parsed structured data."""

    raw_text: str
    normalized_text: str
    structured_data: dict[str, Any]
    page_count: int | None = None


def _pdf_page_images(file_path: Path) -> list[str]:
    """Render PDF pages to base64 PNG strings (up to _MAX_PAGES)."""
    images: list[str] = []
    with fitz.open(file_path) as doc:
        for page in list(doc)[:_MAX_PAGES]:
            mat = fitz.Matrix(_VISION_ZOOM, _VISION_ZOOM)
            pix = page.get_pixmap(matrix=mat)
            images.append(base64.b64encode(pix.tobytes("png")).decode())
    return images


def _pdf_page_count(file_path: Path) -> int:
    with fitz.open(file_path) as doc:
        return doc.page_count


def _call_gpt_with_images(images: list[str]) -> dict[str, Any]:
    """Send rendered PDF page images to GPT Vision and return parsed JSON."""
    content: list[dict] = [{"type": "text", "text": "Extract all information from this resume:"}]
    for img_b64 in images:
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/png;base64,{img_b64}", "detail": "high"},
        })

    client = get_openai_client()
    response = client.chat.completions.create(
        model="gpt-4o",  # Vision requires gpt-4o
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
        temperature=0.1,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content or "{}"
    return json.loads(raw)


def _call_gpt_with_text(text: str) -> dict[str, Any]:
    """Send extracted DOCX text to GPT and return parsed JSON."""
    client = get_openai_client()
    response = client.chat.completions.create(
        model=get_rewrite_model_name(),
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"Extract all information from this resume:\n\n{text}"},
        ],
        temperature=0.1,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content or "{}"
    return json.loads(raw)


def _docx_raw_text(file_path: Path) -> tuple[str, int | None]:
    """Extract plain text from a DOCX file."""
    doc = Document(file_path)
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs), len(doc.sections) or None


def extract_resume_with_gpt(file_path: Path, suffix: str) -> ExtractedResumeContent:
    """Extract and structure all resume content via GPT.

    PDF  → renders pages to PNG images → GPT Vision (gpt-4o)
    DOCX → extracts plain text → GPT text (gpt-4o-mini)
    """
    normalized = suffix.lower()

    if normalized == ".pdf":
        page_count = _pdf_page_count(file_path)
        images = _pdf_page_images(file_path)
        parsed = _call_gpt_with_images(images)
        raw_text = parsed.get("raw_text") or ""
        return ExtractedResumeContent(
            raw_text=raw_text,
            normalized_text=raw_text,
            structured_data=parsed,
            page_count=page_count,
        )

    if normalized == ".docx":
        raw_text, page_count = _docx_raw_text(file_path)
        parsed = _call_gpt_with_text(raw_text)
        # Prefer GPT's raw_text if it provides more content
        final_text = parsed.get("raw_text") or raw_text
        return ExtractedResumeContent(
            raw_text=final_text,
            normalized_text=final_text,
            structured_data=parsed,
            page_count=page_count,
        )

    raise ValueError(f"Unsupported file type: {suffix}")


# Keep the old function name as an alias so any other callers don't break
def extract_resume_text(file_path: Path, suffix: str) -> ExtractedResumeContent:
    return extract_resume_with_gpt(file_path, suffix)

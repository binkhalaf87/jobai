"""GPT-powered semantic matching between a resume and a job description.

Primary mode  — Vision (PDF):
  PDF pages are rendered to PNG images and sent to GPT-4o-mini vision.
  This reads the actual visual layout, handles Arabic RTL, and works on
  scanned PDFs that contain no extractable text.

Fallback mode — Text (DOCX or missing file):
  Extracted/normalized text is sent as a plain-text message.

Both modes return the same structured JSON result.
"""

from __future__ import annotations

import base64
import json
from dataclasses import asdict, dataclass
from pathlib import Path

import fitz  # PyMuPDF — already a project dependency

from app.core.openai_client import get_openai_client

GPT_MATCH_MODEL = "gpt-4o-mini"
GPT_MATCH_MODEL_NAME = "gpt-match-v2"

# Render at 1.5× zoom — good quality without oversized payloads (~400 KB/page)
_VISION_ZOOM = 1.5
_MAX_PAGES = 3  # first 3 pages cover ~95% of resume content

_SYSTEM_PROMPT = """\
You are an expert HR analyst and ATS system specialist.

Your task: analyze the semantic match between a resume and a job description.

Rules:
- The texts may be in Arabic, English, or a mix — analyze meaning, not just keywords.
- Be honest and precise. Do not inflate scores.
- Return ONLY a valid JSON object with the exact structure below. No markdown, no explanation.

JSON structure:
{
  "match_score": <integer 0–100>,
  "matching_keywords": [<up to 10 matched skills or qualifications>],
  "missing_keywords": [<up to 10 required skills absent from the resume>],
  "strengths": [<2–4 specific strengths relevant to this job>],
  "gaps": [<2–4 specific gaps or hiring risks>],
  "recommendation": "<1–2 sentence actionable hiring recommendation>",
  "hiring_suggestion": "<one of: shortlist | interview | needs_review | reject>"
}

Score guidelines:
- 80–100: Excellent fit — strong shortlist candidate
- 60–79: Good fit — worth interviewing, minor gaps
- 40–59: Partial fit — significant gaps but some potential
- 0–39: Poor fit — major mismatches
"""


def _pdf_to_base64_images(pdf_path: str) -> list[str]:
    """Render up to _MAX_PAGES PDF pages to base64-encoded PNG images."""
    images: list[str] = []
    try:
        mat = fitz.Matrix(_VISION_ZOOM, _VISION_ZOOM)
        with fitz.open(pdf_path) as doc:
            for i in range(min(_MAX_PAGES, len(doc))):
                pix = doc[i].get_pixmap(matrix=mat)
                images.append(base64.b64encode(pix.tobytes("png")).decode("utf-8"))
    except Exception:
        pass
    return images


def _build_vision_content(images: list[str], job_text: str) -> list[dict]:
    """Build the multipart content list for a GPT-4o vision message."""
    content: list[dict] = [
        {"type": "text", "text": "Resume (PDF — read all pages carefully):"},
    ]
    for img_b64 in images:
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/png;base64,{img_b64}",
                "detail": "high",
            },
        })
    content.append({
        "type": "text",
        "text": f"\n---\n\nJob Description:\n\n{job_text.strip()}",
    })
    return content


def _build_text_content(resume_text: str, job_text: str) -> list[dict]:
    """Build the content list for a plain-text resume message."""
    return [
        {
            "type": "text",
            "text": (
                f"Resume:\n\n{resume_text.strip()}"
                f"\n\n---\n\nJob Description:\n\n{job_text.strip()}"
            ),
        }
    ]


@dataclass(frozen=True)
class GptMatchResult:
    match_score: float
    matching_keywords: list[str]
    missing_keywords: list[str]
    strengths: list[str]
    gaps: list[str]
    recommendation: str
    hiring_suggestion: str

    def to_payload(self) -> dict:
        return asdict(self)

    @classmethod
    def from_gpt_json(cls, data: dict) -> "GptMatchResult":
        return cls(
            match_score=float(data.get("match_score", 0)),
            matching_keywords=[str(k) for k in data.get("matching_keywords", [])],
            missing_keywords=[str(k) for k in data.get("missing_keywords", [])],
            strengths=[str(s) for s in data.get("strengths", [])],
            gaps=[str(g) for g in data.get("gaps", [])],
            recommendation=str(data.get("recommendation", "")),
            hiring_suggestion=str(data.get("hiring_suggestion", "needs_review")),
        )


def gpt_match_resume_to_job(
    job_text: str,
    *,
    pdf_path: str | None = None,
    resume_text: str = "",
) -> GptMatchResult:
    """Match a resume against a job description using GPT-4o-mini.

    Strategy (in priority order):
    1. PDF file available  → render pages to PNG → send to GPT vision
       (handles scanned PDFs, Arabic RTL, complex layouts)
    2. Text available      → send plain text
    3. Nothing available   → raises ValueError

    Args:
        job_text:     Normalized job description text.
        pdf_path:     Path to the original PDF file (optional).
        resume_text:  Pre-extracted text fallback (optional).
    """
    if not job_text.strip():
        raise ValueError("Job description text is required.")

    client = get_openai_client()
    used_vision = False

    # --- Try vision first ---
    if pdf_path and Path(pdf_path).exists():
        images = _pdf_to_base64_images(pdf_path)
        if images:
            content = _build_vision_content(images, job_text)
            used_vision = True

    # --- Fall back to text ---
    if not used_vision:
        if not resume_text.strip():
            raise ValueError(
                "No PDF file and no resume text available. "
                "Cannot run analysis."
            )
        content = _build_text_content(resume_text, job_text)

    response = client.chat.completions.create(
        model=GPT_MATCH_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_tokens=800,
    )

    raw = response.choices[0].message.content or "{}"
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"GPT returned invalid JSON: {raw[:200]}") from exc

    return GptMatchResult.from_gpt_json(data)

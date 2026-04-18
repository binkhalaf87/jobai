"""GPT-powered resume screening and job matching.

Two entry points:
  gpt_screen_resume_against_jobs() — new batch mode: one call per resume, all jobs at once.
    Returns parsed candidate data + all job matches in one structured response.

  gpt_match_resume_to_job() — legacy single-job mode (kept for backward compatibility).

Both support:
  - Vision mode (PDF):  pages rendered to PNG images, sent to GPT-4o vision.
  - Text fallback:      extracted/normalized text sent as plain text.
"""

from __future__ import annotations

import base64
import json
from dataclasses import asdict, dataclass
from pathlib import Path

import fitz  # PyMuPDF — already a project dependency

from app.core.openai_client import get_openai_client

GPT_MATCH_MODEL = "gpt-4o-mini"
GPT_MATCH_MODEL_NAME = "gpt-match-v3"

# Render at 1.5× zoom — good quality without oversized payloads (~400 KB/page)
_VISION_ZOOM = 1.5
_MAX_PAGES = 3  # first 3 pages cover ~95% of resume content

# ── System prompts ────────────────────────────────────────────────────────────

_SCREENING_SYSTEM_PROMPT = """\
You are an expert AI recruiter and talent screener.

Your task is to fully analyze a candidate's resume and perform an end-to-end screening process without relying on any external scoring logic.

You must extract structured insights, evaluate job fit, and generate hiring recommendations purely based on your own reasoning.

---------------------------------------
INPUT:
You will be given:
1) Candidate resume text
2) A list of job descriptions (each includes title + requirements)

---------------------------------------
INSTRUCTIONS:

1. Parse the resume and extract:
- Full name
- Email (if available)
- Key skills (deduplicated, concise)
- Experience summary (3-5 bullet points max)

2. For EACH job:
- Evaluate how well the candidate matches the job
- Produce a match score (0-100) based on your own reasoning
- Identify:
  - Matching keywords (skills/experience aligned with job)
  - Missing keywords (important requirements not found)

3. Generate deep analysis for EACH job:
- Strengths (why candidate is a good fit)
- Gaps (what is missing or weak)
- Recommendation (short paragraph explaining fit)
- Hiring suggestion (MUST be one of):
  - "shortlist"
  - "interview"
  - "needs_review"
  - "reject"

4. Select the BEST matching job:
- Based on highest score AND overall reasoning quality (not just numbers)

5. Return final structured JSON ONLY (no extra text)

---------------------------------------
OUTPUT FORMAT:

{
  "parsed_name": string | null,
  "email": string | null,
  "skills": string[],
  "experience_summary": string[],
  "top_recommendation": {
    "job_title": string,
    "reason": string
  },
  "matches": [
    {
      "job_id": string,
      "job_title": string,
      "overall_score": number,
      "matching_keywords": string[],
      "missing_keywords": string[],
      "raw_payload": {
        "strengths": string[],
        "gaps": string[],
        "recommendation": string,
        "hiring_suggestion": "shortlist" | "interview" | "needs_review" | "reject"
      }
    }
  ]
}

---------------------------------------
IMPORTANT RULES:

- Do NOT hallucinate experience not present in the resume
- Be strict but fair in scoring
- Scores must reflect real hiring standards (not inflated)
- Missing critical requirements should significantly reduce score
- Keep insights concise and actionable
- Avoid generic phrases - be specific to the resume
- All outputs must be in English
- Return ONLY valid JSON (no explanations outside JSON)

---------------------------------------
GOAL:

Act like a real hiring manager + recruiter + ATS system combined.

Make the output directly usable for a hiring dashboard UI.\
"""

# Legacy single-job prompt (kept for gpt_match_resume_to_job)
_LEGACY_SYSTEM_PROMPT = """\
You are an expert HR analyst and ATS system specialist.

Your task: analyze the semantic match between a resume and a job description.

Rules:
- The texts may be in Arabic, English, or a mix — analyze meaning, not just keywords.
- Be honest and precise. Do not inflate scores.
- Return ONLY a valid JSON object with the exact structure below. No markdown, no explanation.

JSON structure:
{
  "match_score": <integer 0-100>,
  "matching_keywords": [<up to 10 matched skills or qualifications>],
  "missing_keywords": [<up to 10 required skills absent from the resume>],
  "strengths": [<2-4 specific strengths relevant to this job>],
  "gaps": [<2-4 specific gaps or hiring risks>],
  "recommendation": "<1-2 sentence actionable hiring recommendation>",
  "hiring_suggestion": "<one of: shortlist | interview | needs_review | reject>"
}

Score guidelines:
- 80-100: Excellent fit - strong shortlist candidate
- 60-79: Good fit - worth interviewing, minor gaps
- 40-59: Partial fit - significant gaps but some potential
- 0-39: Poor fit - major mismatches
"""


# ── PDF helpers ───────────────────────────────────────────────────────────────


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


def _vision_content_resume_prefix(images: list[str]) -> list[dict]:
    """Build image content blocks for the resume part of a vision message."""
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
    return content


# ── Batch screening (new) ─────────────────────────────────────────────────────


@dataclass(frozen=True)
class GptJobMatch:
    job_id: str
    job_title: str
    overall_score: float
    matching_keywords: list[str]
    missing_keywords: list[str]
    strengths: list[str]
    gaps: list[str]
    recommendation: str
    hiring_suggestion: str

    def to_payload(self) -> dict:
        return {
            "matching_keywords": self.matching_keywords,
            "missing_keywords": self.missing_keywords,
            "strengths": self.strengths,
            "gaps": self.gaps,
            "recommendation": self.recommendation,
            "hiring_suggestion": self.hiring_suggestion,
        }


@dataclass(frozen=True)
class GptScreeningResult:
    parsed_name: str | None
    email: str | None
    skills: list[str]
    experience_summary: list[str]
    top_recommendation_job_title: str
    top_recommendation_reason: str
    matches: list[GptJobMatch]

    @classmethod
    def from_gpt_json(cls, data: dict) -> "GptScreeningResult":
        raw_matches = data.get("matches") or []
        matches: list[GptJobMatch] = []
        for m in raw_matches:
            payload = m.get("raw_payload") or {}
            matches.append(GptJobMatch(
                job_id=str(m.get("job_id", "")),
                job_title=str(m.get("job_title", "")),
                overall_score=float(m.get("overall_score", 0)),
                matching_keywords=[str(k) for k in m.get("matching_keywords", [])],
                missing_keywords=[str(k) for k in m.get("missing_keywords", [])],
                strengths=[str(s) for s in payload.get("strengths", [])],
                gaps=[str(g) for g in payload.get("gaps", [])],
                recommendation=str(payload.get("recommendation", "")),
                hiring_suggestion=str(payload.get("hiring_suggestion", "needs_review")),
            ))

        top = data.get("top_recommendation") or {}
        return cls(
            parsed_name=data.get("parsed_name") or None,
            email=data.get("email") or None,
            skills=[str(s) for s in data.get("skills", [])],
            experience_summary=[str(e) for e in data.get("experience_summary", [])],
            top_recommendation_job_title=str(top.get("job_title", "")),
            top_recommendation_reason=str(top.get("reason", "")),
            matches=matches,
        )


def _format_jobs_text(jobs: list[dict]) -> str:
    """Format a list of jobs for inclusion in the GPT prompt."""
    lines: list[str] = ["JOBS TO EVALUATE:\n"]
    for i, job in enumerate(jobs, 1):
        lines.append(f"JOB {i}:")
        lines.append(f"ID: {job['job_id']}")
        lines.append(f"Title: {job['job_title']}")
        lines.append(f"Description:\n{job['job_text'].strip()}")
        lines.append("")
    return "\n".join(lines)


def gpt_screen_resume_against_jobs(
    jobs: list[dict],
    *,
    pdf_path: str | None = None,
    resume_text: str = "",
) -> GptScreeningResult:
    """Screen a resume against multiple jobs in one GPT call.

    Args:
        jobs:         List of {"job_id": str, "job_title": str, "job_text": str}.
        pdf_path:     Path to the original PDF file (optional, enables vision mode).
        resume_text:  Pre-extracted text fallback (optional).

    Returns GptScreeningResult with parsed candidate data and per-job matches.
    """
    if not jobs:
        raise ValueError("At least one job is required.")

    jobs_text = _format_jobs_text(jobs)
    client = get_openai_client()
    used_vision = False

    if pdf_path and Path(pdf_path).exists():
        images = _pdf_to_base64_images(pdf_path)
        if images:
            content = _vision_content_resume_prefix(images)
            content.append({"type": "text", "text": f"\n---\n\n{jobs_text}"})
            used_vision = True

    if not used_vision:
        if not resume_text.strip():
            raise ValueError("No PDF file and no resume text available.")
        content = [{"type": "text", "text": f"Resume:\n\n{resume_text.strip()}\n\n---\n\n{jobs_text}"}]

    response = client.chat.completions.create(
        model=GPT_MATCH_MODEL,
        messages=[
            {"role": "system", "content": _SCREENING_SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_tokens=2500,
    )

    raw = response.choices[0].message.content or "{}"
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"GPT returned invalid JSON: {raw[:200]}") from exc

    return GptScreeningResult.from_gpt_json(data)


# ── Legacy single-job match (kept for backward compatibility) ─────────────────


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
    """Match a resume against a single job description (legacy, single-call mode)."""
    if not job_text.strip():
        raise ValueError("Job description text is required.")

    client = get_openai_client()
    used_vision = False

    if pdf_path and Path(pdf_path).exists():
        images = _pdf_to_base64_images(pdf_path)
        if images:
            content = _vision_content_resume_prefix(images)
            content.append({"type": "text", "text": f"\n---\n\nJob Description:\n\n{job_text.strip()}"})
            used_vision = True

    if not used_vision:
        if not resume_text.strip():
            raise ValueError("No PDF file and no resume text available.")
        content = [{"type": "text", "text": (
            f"Resume:\n\n{resume_text.strip()}"
            f"\n\n---\n\nJob Description:\n\n{job_text.strip()}"
        )}]

    response = client.chat.completions.create(
        model=GPT_MATCH_MODEL,
        messages=[
            {"role": "system", "content": _LEGACY_SYSTEM_PROMPT},
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

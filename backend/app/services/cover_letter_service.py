"""Generate a single cover letter / outreach email via OpenAI JSON mode."""

from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.resume import Resume

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are an expert career coach who writes concise, compelling outreach emails for job seekers.
Generate one email given the job details.

Rules:
- The email must be self-contained and ready to send (no placeholder text like [Your Name]).
- Keep it under 200 words.
- Subject line must be specific and under 60 characters.
- Address the recruiter/hiring manager professionally if no name is known (e.g., "Dear Hiring Manager").
- Optimise for the Saudi / GCC job market when relevant.

Respond ONLY with valid JSON matching this exact schema:
{"subject": "...", "body": "..."}
"""


def get_openai_client() -> AsyncOpenAI:
    settings = get_settings()
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured for cover letter generation.")
    return AsyncOpenAI(api_key=settings.openai_api_key)


def _get_resume_text(db: Session, user_id: str, resume_id: str) -> str:
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
    if not resume:
        return ""
    return (resume.normalized_text or resume.raw_text or "").strip()


async def generate_cover_letter(
    db: Session,
    user_id: str,
    job_title: str,
    company_name: str | None,
    job_description: str | None,
    resume_id: str | None,
) -> dict:
    """Returns {"subject": str, "body": str}."""
    resume_text = ""
    if resume_id:
        resume_text = _get_resume_text(db, user_id, resume_id)[:3000]

    parts = [f"Job Title: {job_title}"]
    if company_name:
        parts.append(f"Company: {company_name}")
    if job_description:
        parts.append(f"\nJob Description:\n{job_description[:2000]}")
    if resume_text:
        parts.append(f"\nApplicant Resume (for context):\n{resume_text}")

    client = get_openai_client()
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.7,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": "\n".join(parts)},
        ],
    )

    raw = response.choices[0].message.content or "{}"
    try:
        letter = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("Cover letter JSON parse error: %s", raw[:200])
        raise ValueError("AI returned malformed JSON")

    if "subject" not in letter or "body" not in letter:
        raise ValueError("AI response missing subject or body")

    return {"subject": letter["subject"], "body": letter["body"]}

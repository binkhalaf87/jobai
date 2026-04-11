"""Generate 3 cover letter / outreach email variants via OpenAI JSON mode."""

from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from app.core.config import get_settings

settings = get_settings()
from app.models.resume import Resume

logger = logging.getLogger(__name__)

_client = AsyncOpenAI(api_key=settings.openai_api_key)

_SYSTEM_PROMPT = """\
You are an expert career coach who writes concise, compelling outreach emails for job seekers.
Generate exactly 3 email variants (formal, creative, concise) given the job details.

Rules:
- Each email must be self-contained and ready to send.
- Keep formal under 220 words, creative under 200 words, concise under 100 words.
- Do not use placeholder text like [Your Name] — the emails should read as genuine outreach.
- Subject lines must be specific and under 60 characters.
- Address the recruiter/hiring manager professionally if no name is known (e.g., "Dear Hiring Manager").
- Optimise for the Saudi / GCC job market when relevant.

Respond ONLY with valid JSON matching this exact schema:
{
  "formal":   {"subject": "...", "body": "..."},
  "creative": {"subject": "...", "body": "..."},
  "concise":  {"subject": "...", "body": "..."}
}
"""


async def generate_cover_letters(
    db: Session,
    user_id: str,
    job_title: str,
    company_name: str | None,
    job_description: str | None,
    resume_id: str | None,
) -> dict:
    """
    Returns a dict with keys formal, creative, concise each having subject + body.
    """
    # Optionally pull resume text for context
    resume_text = ""
    if resume_id:
        resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
        if resume and resume.extracted_text:
            resume_text = resume.extracted_text[:3000]  # cap tokens

    user_prompt_parts = [f"Job Title: {job_title}"]
    if company_name:
        user_prompt_parts.append(f"Company: {company_name}")
    if job_description:
        user_prompt_parts.append(f"\nJob Description:\n{job_description[:2000]}")
    if resume_text:
        user_prompt_parts.append(f"\nApplicant Resume (for context):\n{resume_text}")

    user_prompt = "\n".join(user_prompt_parts)

    response = await _client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.7,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )

    raw = response.choices[0].message.content or "{}"
    try:
        letters = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("Cover letter JSON parse error: %s", raw[:200])
        raise ValueError("AI returned malformed JSON")

    # Validate structure
    for variant in ("formal", "creative", "concise"):
        if variant not in letters:
            raise ValueError(f"AI response missing '{variant}' variant")
        if "subject" not in letters[variant] or "body" not in letters[variant]:
            raise ValueError(f"AI response missing subject/body for '{variant}'")

    return letters

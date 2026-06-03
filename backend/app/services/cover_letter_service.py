"""Generate a single cover letter / outreach email via OpenAI JSON mode."""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from datetime import datetime, timedelta, timezone

from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.sanitize import UNTRUSTED_DATA_NOTICE, sanitize_user_input
from app.models.resume import Resume
from app.models.smart_send_letter_cache import SmartSendLetterCache

logger = logging.getLogger(__name__)

_CACHE_TTL_DAYS = 30


def _make_cache_key(
    user_id: str,
    job_title: str,
    company_name: str | None,
    job_description: str | None,
    resume_id: str | None,
) -> str:
    raw = "|".join([
        user_id,
        job_title.lower().strip(),
        (company_name or "").lower().strip(),
        (job_description or "")[:500].strip(),
        resume_id or "",
    ])
    return hashlib.sha256(raw.encode()).hexdigest()


def _get_cached_letter(db: Session, user_id: str, cache_key: str) -> dict | None:
    now = datetime.now(timezone.utc)
    row = db.query(SmartSendLetterCache).filter(
        SmartSendLetterCache.user_id == user_id,
        SmartSendLetterCache.cache_key == cache_key,
        SmartSendLetterCache.expires_at > now,
    ).first()
    if row:
        return {"subject": row.subject, "body": row.body}
    return None


def _store_cached_letter(db: Session, user_id: str, cache_key: str, subject: str, body: str) -> None:
    now = datetime.now(timezone.utc)
    existing = db.query(SmartSendLetterCache).filter(
        SmartSendLetterCache.user_id == user_id,
        SmartSendLetterCache.cache_key == cache_key,
    ).first()
    if existing:
        existing.subject = subject
        existing.body = body
        existing.created_at = now
        existing.expires_at = now + timedelta(days=_CACHE_TTL_DAYS)
    else:
        db.add(SmartSendLetterCache(
            id=str(uuid.uuid4()),
            user_id=user_id,
            cache_key=cache_key,
            subject=subject,
            body=body,
            created_at=now,
            expires_at=now + timedelta(days=_CACHE_TTL_DAYS),
        ))
    db.commit()

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
""" + UNTRUSTED_DATA_NOTICE


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
    """Returns {"subject": str, "body": str}. Checks cache before calling OpenAI."""
    cache_key = _make_cache_key(user_id, job_title, company_name, job_description, resume_id)
    cached = _get_cached_letter(db, user_id, cache_key)
    if cached:
        logger.debug("Letter cache hit for user %s", user_id)
        return cached

    resume_text = ""
    if resume_id:
        resume_text = _get_resume_text(db, user_id, resume_id)[:3000]

    parts = [f"Job Title: {sanitize_user_input(job_title)}"]
    if company_name:
        parts.append(f"Company: {sanitize_user_input(company_name)}")
    if job_description:
        parts.append(f"\nJob Description:\n{sanitize_user_input(job_description, max_length=2000)}")
    if resume_text:
        parts.append(f"\nApplicant Resume (for context):\n{sanitize_user_input(resume_text, max_length=3000)}")

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

    result = {"subject": letter["subject"], "body": letter["body"]}
    _store_cached_letter(db, user_id, cache_key, result["subject"], result["body"])
    return result

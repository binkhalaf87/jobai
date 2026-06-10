"""Generate cover letter / outreach emails via OpenAI JSON mode."""

from __future__ import annotations

import asyncio
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
    job_title: str | None,
    company_name: str | None,
    job_description: str | None,
    resume_id: str | None,
) -> str:
    raw = "|".join([
        user_id,
        (job_title or "").lower().strip(),
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

_SYSTEM_PROMPT_TARGETED = """\
You are an expert career coach who writes concise, targeted job application emails.
Generate one email given the job details and applicant resume.

Rules:
- Write a targeted JOB APPLICATION email for the specific role.
- Open by explicitly stating you are applying for the specific job title at the company.
- Reference 2-3 specific skills or experiences from the applicant's resume that directly match the job requirements.
- Be direct and role-specific — avoid vague sentences like "I am an experienced professional with a proven track record".
- Keep it under 200 words.
- Subject line format: "Application for [Job Title] – [Candidate First Name]" (under 60 characters).
- Address as "Dear Hiring Manager" unless a name is provided.
- The email must be self-contained and ready to send (no placeholder text like [Your Name]).
- Optimise for the Saudi / GCC job market when relevant.

Respond ONLY with valid JSON matching this exact schema:
{"subject": "...", "body": "..."}
""" + UNTRUSTED_DATA_NOTICE

_SYSTEM_PROMPT_GENERAL = """\
You are an expert career coach who writes compelling personal-brand outreach emails.
Generate a self-marketing email based ONLY on the applicant's resume — NO specific job title, NO specific company.

Rules:
- This is a PERSONAL MARKETING email to introduce the candidate proactively to any company.
- Do NOT mention any job title, open position, or application — the candidate is marketing themselves, not applying for a specific role.
- Highlight the candidate's most impressive skills, achievements, and experience from their resume.
- Use a confident, professional tone that sparks interest in speaking with the candidate.
- Keep it under 180 words.
- Subject line: brief and intriguing, focused on the candidate's value (e.g., "Experienced Data Engineer – Open to New Opportunities"). Under 60 characters.
- Address as "Dear Hiring Manager".
- The email must be self-contained and ready to send (no placeholder text like [Your Name]).
- Optimise for the Saudi / GCC job market when relevant.
- If no resume is provided, write a polished general self-introduction without fabricating any specific details.

Respond ONLY with valid JSON matching this exact schema:
{"subject": "...", "body": "..."}
""" + UNTRUSTED_DATA_NOTICE

# Keep backward-compatible alias
_SYSTEM_PROMPT = _SYSTEM_PROMPT_TARGETED


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
    job_title: str | None,
    company_name: str | None,
    job_description: str | None,
    resume_id: str | None,
) -> dict:
    """Returns {"subject": str, "body": str}. Checks cache before calling OpenAI."""
    is_general = not job_title or not job_title.strip()
    effective_title = job_title.strip() if not is_general else ""

    cache_key = _make_cache_key(user_id, effective_title, company_name, job_description, resume_id)
    cached = _get_cached_letter(db, user_id, cache_key)
    if cached:
        logger.debug("Letter cache hit for user %s", user_id)
        return cached

    resume_text = ""
    if resume_id:
        resume_text = _get_resume_text(db, user_id, resume_id)[:3000]

    if is_general:
        system_prompt = _SYSTEM_PROMPT_GENERAL
        parts = ["Generate a personal marketing email based on the applicant's resume below."]
        if resume_text:
            parts.append(f"\nApplicant Resume:\n{sanitize_user_input(resume_text, max_length=3000)}")
        else:
            parts.append("No resume provided — write a polished general self-introduction.")
    else:
        system_prompt = _SYSTEM_PROMPT_TARGETED
        parts = [f"Job Title: {sanitize_user_input(effective_title)}"]
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
            {"role": "system", "content": system_prompt},
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


_STYLE_SUFFIXES = {
    "formal":   "Write in a formal, professional tone.",
    "creative": "Write in a warm, creative tone that shows personality while staying professional.",
    "concise":  "Write an ultra-concise version under 120 words — every sentence must earn its place.",
}


async def _generate_variant(
    db: Session,
    user_id: str,
    job_title: str | None,
    company_name: str | None,
    job_description: str | None,
    resume_id: str | None,
    style: str,
) -> dict:
    """Generate one styled variant. Reuses the main cache infrastructure with a style suffix."""
    is_general = not job_title or not job_title.strip()
    effective_title = job_title.strip() if not is_general else ""

    cache_key = _make_cache_key(
        user_id + f":{style}", effective_title, company_name, job_description, resume_id
    )
    cached = _get_cached_letter(db, user_id, cache_key)
    if cached:
        return cached

    resume_text = ""
    if resume_id:
        resume_text = _get_resume_text(db, user_id, resume_id)[:3000]

    style_note = _STYLE_SUFFIXES.get(style, "")
    if is_general:
        system_prompt = _SYSTEM_PROMPT_GENERAL + f"\n\n{style_note}"
        parts = ["Generate a personal marketing email based on the applicant's resume below."]
        if resume_text:
            parts.append(f"\nApplicant Resume:\n{sanitize_user_input(resume_text, max_length=3000)}")
        else:
            parts.append("No resume provided — write a polished general self-introduction.")
    else:
        system_prompt = _SYSTEM_PROMPT_TARGETED + f"\n\n{style_note}"
        parts = [f"Job Title: {sanitize_user_input(effective_title)}"]
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
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "\n".join(parts)},
        ],
    )
    raw = response.choices[0].message.content or "{}"
    try:
        letter = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError(f"AI returned malformed JSON for {style} variant")

    if "subject" not in letter or "body" not in letter:
        raise ValueError(f"AI response missing subject or body for {style} variant")

    result = {"subject": letter["subject"], "body": letter["body"]}
    _store_cached_letter(db, user_id, cache_key, result["subject"], result["body"])
    return result


async def generate_cover_letters(
    db: Session,
    user_id: str,
    job_title: str | None,
    company_name: str | None,
    job_description: str | None,
    resume_id: str | None,
) -> dict:
    """Generate 3 styled variants in parallel.
    Returns {formal: {subject, body}, creative: {subject, body}, concise: {subject, body}}."""
    formal, creative, concise = await asyncio.gather(
        _generate_variant(db, user_id, job_title, company_name, job_description, resume_id, "formal"),
        _generate_variant(db, user_id, job_title, company_name, job_description, resume_id, "creative"),
        _generate_variant(db, user_id, job_title, company_name, job_description, resume_id, "concise"),
    )
    return {"formal": formal, "creative": creative, "concise": concise}

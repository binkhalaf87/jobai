"""GPT-powered job description keyword extraction — replaces the spaCy/regex pipeline."""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass

from app.core.openai_client import get_openai_client
from app.services.rewrite_engine import get_rewrite_model_name

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are an expert job description analyst. Extract structured keyword data from the job description and return ONLY valid JSON with this exact shape:

{
  "hard_skills": ["Python", "PostgreSQL", ...],
  "soft_skills": ["Communication", "Leadership", ...],
  "job_titles": ["Senior Backend Engineer", ...],
  "tools": ["Docker", "Jira", "Figma", ...],
  "years_of_experience": ["3+ years", "5 years", ...],
  "role_keywords": ["microservices", "CI/CD", "REST API", ...]
}

Rules:
- hard_skills: specific technical skills, languages, frameworks, databases, cloud platforms.
- soft_skills: interpersonal and professional competencies.
- job_titles: the role title(s) mentioned in the description.
- tools: specific software tools, platforms, or services.
- years_of_experience: extract exact phrases like "3+ years", "5 years of experience".
- role_keywords: other important domain-specific keywords not captured above (max 15).
- All arrays may be empty if no relevant items are found.
- Deduplicate entries; preserve original casing.
- Return JSON only — no markdown, no extra text.
"""


@dataclass(frozen=True)
class JobDescriptionKeywordData:
    """Structured keyword data extracted from a job description."""

    hard_skills: list[str]
    soft_skills: list[str]
    job_titles: list[str]
    tools: list[str]
    years_of_experience: list[str]
    role_keywords: list[str]

    def to_dict(self) -> dict:
        return asdict(self)


def extract_job_description_keywords(title: str, normalized_text: str) -> JobDescriptionKeywordData:
    """Extract structured keyword data from a job description via GPT."""
    combined = f"Job Title: {title.strip()}\n\n{normalized_text.strip()}"

    try:
        client = get_openai_client()
        response = client.chat.completions.create(
            model=get_rewrite_model_name(),
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": combined},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
    except Exception:
        logger.exception("GPT job keyword extraction failed for title '%s'", title)
        data = {}

    def _list(key: str) -> list[str]:
        val = data.get(key, [])
        return [str(v).strip() for v in val if str(v).strip()] if isinstance(val, list) else []

    return JobDescriptionKeywordData(
        hard_skills=_list("hard_skills"),
        soft_skills=_list("soft_skills"),
        job_titles=_list("job_titles") or [title.strip()],
        tools=_list("tools"),
        years_of_experience=_list("years_of_experience"),
        role_keywords=_list("role_keywords"),
    )

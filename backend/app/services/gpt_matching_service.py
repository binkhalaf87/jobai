"""GPT-powered semantic matching between a resume and a job description.

Complements the TF-IDF vectorizer with deep language understanding:
- Works across Arabic, English, and mixed-language documents
- Returns structured JSON with score, strengths, gaps, and hiring suggestion
- Uses gpt-4o-mini for cost efficiency
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass

from app.core.openai_client import get_openai_client

GPT_MATCH_MODEL = "gpt-4o-mini"
GPT_MATCH_MODEL_NAME = "gpt-match-v1"

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


def gpt_match_resume_to_job(resume_text: str, job_text: str) -> GptMatchResult:
    """Call GPT to semantically match a resume against a job description.

    Raises RuntimeError if the OpenAI key is missing.
    Raises ValueError if the response cannot be parsed.
    """
    client = get_openai_client()

    user_message = (
        f"**Resume:**\n\n{resume_text.strip()}\n\n"
        f"---\n\n"
        f"**Job Description:**\n\n{job_text.strip()}"
    )

    response = client.chat.completions.create(
        model=GPT_MATCH_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
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

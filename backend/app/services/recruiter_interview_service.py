"""Generate interview question sets and analyse candidate video responses."""

from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from app.core.openai_client import get_openai_client
from app.models.interview_response import InterviewResponse
from app.models.job_description import JobDescription
from app.models.recruiter_interview import RecruiterInterview
from app.models.resume import Resume
from app.services.rewrite_engine import get_rewrite_model_name

logger = logging.getLogger(__name__)

_MAX_RESUME_CHARS = 3200
_MAX_JD_CHARS = 2600

_TYPE_INSTRUCTIONS: dict[str, str] = {
    "hr": (
        "Focus exclusively on behavioral and situational questions. "
        "Probe for ownership, teamwork, communication, conflict resolution, and leadership."
    ),
    "technical": (
        "Focus exclusively on role-specific technical depth: tools, architecture decisions, "
        "debugging, trade-offs, and domain knowledge."
    ),
    "mixed": (
        "Balance behavioral and technical questions roughly 50/50. "
        "Make the set feel like a real hiring interview flow."
    ),
}

_LANG_INSTRUCTIONS: dict[str, str] = {
    "en": "Write all questions and output in English.",
    "ar": "Write all questions and output in Arabic.",
}


def _extract_json(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)  # type: ignore[no-any-return]


def _trim(value: str | None, limit: int) -> str:
    if not value:
        return ""
    return value.strip()[:limit]


def generate_interview_questions(
    db: Session,
    recruiter_id: str,
    resume: Resume,
    job: JobDescription,
    interview_type: str = "mixed",
    language: str = "en",
    question_count: int = 8,
) -> RecruiterInterview:
    """Call OpenAI to produce a tailored question set, persist and return the RecruiterInterview."""
    resume_text = _trim(resume.normalized_text or resume.raw_text, _MAX_RESUME_CHARS)
    job_text = _trim(job.normalized_text or job.source_text, _MAX_JD_CHARS)

    lang_note = _LANG_INSTRUCTIONS.get(language, _LANG_INSTRUCTIONS["en"])
    type_note = _TYPE_INSTRUCTIONS.get(interview_type, _TYPE_INSTRUCTIONS["mixed"])

    system = (
        "You are a senior technical recruiter preparing a structured interview question set.\n"
        f"{type_note}\n"
        f"{lang_note}\n\n"
        "Use the candidate resume and job description to create targeted, role-specific questions. "
        "Avoid generic questions. Reference the candidate's actual experience where possible.\n\n"
        "Return ONLY valid JSON with this exact shape:\n"
        "{\n"
        '  "candidate_summary": "string",\n'
        '  "focus_areas": ["string", "string"],\n'
        '  "questions": [\n'
        '    {"index": 0, "question": "string", "type": "hr", "focus_area": "string"},\n'
        '    ...\n'
        "  ]\n"
        "}\n\n"
        "Rules:\n"
        "- candidate_summary: 1-2 sentences describing the candidate's profile relative to the role.\n"
        f"- Generate exactly {question_count} questions.\n"
        "- focus_areas: 3-5 key competencies to cover in this interview.\n"
        "- question.type must be 'hr' or 'technical'.\n"
        "- questions must be specific to this candidate and role — not generic."
    )

    user = (
        f"Candidate resume:\n{resume_text or 'Not provided.'}\n\n"
        f"Job title: {job.title}\n"
        f"Company: {job.company_name or 'Not provided'}\n"
        f"Job description:\n{job_text or 'Not provided.'}"
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=get_rewrite_model_name(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.6,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    payload = _extract_json(raw)

    questions_raw = payload.get("questions", [])
    questions: list[dict[str, Any]] = []
    for i, item in enumerate(questions_raw):
        q_type = str(item.get("type", "hr")).lower()
        if q_type not in {"hr", "technical"}:
            q_type = "hr"
        questions.append(
            {
                "index": i,
                "question": str(item.get("question", "")).strip(),
                "type": q_type,
                "focus_area": str(item.get("focus_area", "")).strip() or None,
            }
        )

    generated = {
        "candidate_summary": str(payload.get("candidate_summary", "")).strip(),
        "focus_areas": [str(fa).strip() for fa in payload.get("focus_areas", []) if str(fa).strip()],
        "questions": questions,
    }

    interview = RecruiterInterview(
        recruiter_id=recruiter_id,
        resume_id=resume.id,
        job_id=job.id,
        interview_type=interview_type,
        language=language,
        generated_questions=generated,
        status="ready",
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


def analyse_interview_responses(
    job_title: str,
    language: str,
    questions: list[dict[str, Any]],
    responses: list[InterviewResponse],
) -> dict[str, Any]:
    """Call OpenAI to produce per-answer feedback and an overall assessment."""
    lang_note = _LANG_INSTRUCTIONS.get(language, _LANG_INSTRUCTIONS["en"])

    qa_pairs = []
    for q in questions:
        idx = int(q.get("index", 0))
        matching = next((r for r in responses if r.question_index == idx), None)
        answer = (matching.text_answer or "").strip() if matching else ""
        qa_pairs.append(
            f"Q{idx + 1}: {q.get('question', '')}\nAnswer: {answer or '[No answer provided]'}"
        )

    qa_text = "\n\n".join(qa_pairs)

    system = (
        "You are a senior hiring evaluator reviewing a candidate's recorded interview answers.\n"
        f"{lang_note}\n\n"
        "Evaluate the answers and return ONLY valid JSON with this exact shape:\n"
        "{\n"
        '  "overall_score": <integer 0-100>,\n'
        '  "overall_impression": "string",\n'
        '  "hire_recommendation": "strong_yes | yes | maybe | no",\n'
        '  "per_question": [\n'
        '    {"index": 0, "score": <0-100>, "feedback": "string", "strength": "string", "weakness": "string"},\n'
        "    ...\n"
        "  ]\n"
        "}\n\n"
        "Rules:\n"
        "- overall_impression: 2-3 sentences summarising the candidate's interview performance.\n"
        "- feedback per question: 1-2 sentences, specific and actionable.\n"
        "- strength / weakness: one short phrase each."
    )

    user = f"Job title: {job_title}\n\nInterview Q&A:\n{qa_text}"

    client = get_openai_client()
    response = client.chat.completions.create(
        model=get_rewrite_model_name(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    return _extract_json(raw)

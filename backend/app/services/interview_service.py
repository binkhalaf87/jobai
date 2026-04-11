"""Service layer for AI-powered interview sessions."""

from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.openai_client import get_openai_client
from app.models.interview import InterviewSession
from app.services.rewrite_engine import get_rewrite_model_name

logger = logging.getLogger(__name__)

INTERVIEW_TEMPERATURE = 0.7
EVAL_TEMPERATURE = 0.3

# ─── Level / type display helpers ─────────────────────────────────────────────

_LEVEL_LABELS = {
    "entry": "Entry Level (0–2 years)",
    "mid": "Mid Level (3–5 years)",
    "senior": "Senior Level (6+ years)",
}

_TYPE_LABELS = {
    "hr": "HR / Behavioral",
    "technical": "Technical",
    "mixed": "Mixed (HR + Technical)",
}

_TYPE_INSTRUCTIONS = {
    "hr": (
        "Focus exclusively on behavioral, situational, and competency-based questions. "
        "Topics: teamwork, leadership, conflict resolution, communication, motivation, adaptability."
    ),
    "technical": (
        "Focus exclusively on technical knowledge, role-specific skills, problem-solving, "
        "tools, frameworks, and domain expertise relevant to the job title."
    ),
    "mixed": (
        "Provide a balanced mix: roughly half behavioral/HR questions and half technical questions. "
        "Ensure both dimensions are well represented."
    ),
}

# ─── Prompts ──────────────────────────────────────────────────────────────────

def _build_question_gen_prompt(
    job_title: str,
    experience_level: str,
    interview_type: str,
    language: str,
    question_count: int,
) -> tuple[str, str]:
    """Return (system_prompt, user_prompt) for question generation."""
    lang_instruction = (
        "Write all questions in Arabic." if language == "ar"
        else "Write all questions in English."
    )
    type_instruction = _TYPE_INSTRUCTIONS.get(interview_type, _TYPE_INSTRUCTIONS["mixed"])
    level_label = _LEVEL_LABELS.get(experience_level, experience_level)
    type_label = _TYPE_LABELS.get(interview_type, interview_type)

    system = (
        f"You are a senior interviewer at a top-tier company. "
        f"Generate exactly {question_count} realistic, high-quality interview questions "
        f"for a {level_label} {job_title} position.\n\n"
        f"Interview type: {type_label}.\n"
        f"{type_instruction}\n\n"
        f"{lang_instruction}\n\n"
        "Rules:\n"
        "- Questions must be specific, relevant, and appropriately challenging for the level.\n"
        "- Avoid generic filler questions.\n"
        "- Each question must have a 'type' field: 'hr' for behavioral/situational, 'technical' for skills-based.\n\n"
        "Return ONLY valid JSON with this exact structure:\n"
        '{"questions": [{"index": 1, "question": "...", "type": "hr"}, ...]}\n'
        f"Produce exactly {question_count} items in the array."
    )
    user = f"Generate {question_count} interview questions for: {job_title} ({level_label}, {type_label})."
    return system, user


def _build_eval_prompt(
    job_title: str,
    experience_level: str,
    language: str,
    question: str,
    answer: str,
) -> tuple[str, str]:
    """Return (system_prompt, user_prompt) for a single answer evaluation."""
    level_label = _LEVEL_LABELS.get(experience_level, experience_level)
    lang_note = (
        "The candidate answered in Arabic. Evaluate accordingly."
        if language == "ar" else
        "The candidate answered in English."
    )
    response_lang = (
        "Write your evaluation (strengths, weaknesses, improved_answer) in Arabic."
        if language == "ar" else
        "Write your evaluation in English."
    )

    system = (
        f"You are an expert interviewer evaluating a candidate for a {level_label} {job_title} position. "
        f"{lang_note}\n\n"
        "Evaluate the answer across these five dimensions:\n"
        "- Relevance (does it directly answer the question?)\n"
        "- Clarity (is it well-structured and easy to follow?)\n"
        "- Professionalism (tone, vocabulary, composure)\n"
        "- Confidence (assertiveness, conviction)\n"
        "- Role-fit (demonstrates skills/experience relevant to the role)\n\n"
        f"{response_lang}\n\n"
        "Return ONLY valid JSON with this exact structure:\n"
        '{"score": 7.5, "strengths": ["...", "..."], "weaknesses": ["...", "..."], "improved_answer": "..."}\n\n'
        "Rules:\n"
        "- score: float 0–10 (one decimal)\n"
        "- strengths: 2–3 specific positive observations\n"
        "- weaknesses: 1–3 specific improvement areas (empty array [] if the answer is strong)\n"
        "- improved_answer: a polished, professional version that preserves the candidate's meaning "
        "but significantly improves structure, specificity, and impact. Use STAR format where applicable."
    )
    user = f"Question: {question}\n\nCandidate's answer: {answer}"
    return system, user


def _build_final_report_prompt(
    job_title: str,
    experience_level: str,
    language: str,
    avg_score: float,
    qa_summary: str,
) -> tuple[str, str]:
    """Return (system_prompt, user_prompt) for the final interview report."""
    level_label = _LEVEL_LABELS.get(experience_level, experience_level)
    response_lang = (
        "Write the summary in Arabic." if language == "ar" else "Write the summary in English."
    )
    readiness = (
        "Needs Improvement" if avg_score < 5
        else "Good Progress" if avg_score < 7.5
        else "Interview Ready"
    )

    system = (
        f"You are a senior hiring manager summarizing an interview for a {level_label} {job_title} position. "
        f"The candidate's average answer score was {avg_score:.1f}/10.\n\n"
        f"{response_lang}\n\n"
        "Based on the Q&A performance below, produce a JSON final report.\n\n"
        "Return ONLY valid JSON with this exact structure:\n"
        "{\n"
        f'  "overall_score": {avg_score:.1f},\n'
        f'  "readiness": "{readiness}",\n'
        '  "summary": "2–3 sentences summarizing overall performance, top strength, and main area to improve",\n'
        '  "breakdown": {\n'
        '    "relevance": 7.5,\n'
        '    "clarity": 7.0,\n'
        '    "professionalism": 8.0,\n'
        '    "confidence": 6.5,\n'
        '    "role_fit": 7.5\n'
        '  }\n'
        "}\n\n"
        "Breakdown scores must be floats 0–10. Compute them from your assessment of the answers."
    )
    user = f"Interview Q&A summary:\n\n{qa_summary}"
    return system, user


# ─── JSON extraction ──────────────────────────────────────────────────────────

def _extract_json(raw: str) -> dict[str, Any]:
    """Strip markdown fences and parse JSON from model response."""
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)  # type: ignore[no-any-return]


# ─── Core service functions ───────────────────────────────────────────────────

def create_session(
    db: Session,
    user_id: str,
    job_title: str,
    experience_level: str,
    interview_type: str,
    language: str,
    question_count: int,
) -> InterviewSession:
    """Create session, generate questions via OpenAI, persist and return."""
    system_prompt, user_prompt = _build_question_gen_prompt(
        job_title, experience_level, interview_type, language, question_count
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=get_rewrite_model_name(),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=INTERVIEW_TEMPERATURE,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    payload = _extract_json(raw)
    questions: list[dict[str, Any]] = payload.get("questions", [])

    # Ensure correct length — pad or trim defensively
    if len(questions) < question_count:
        logger.warning("Model returned %d questions, expected %d", len(questions), question_count)
    questions = questions[:question_count]

    session = InterviewSession(
        user_id=user_id,
        job_title=job_title,
        experience_level=experience_level,
        interview_type=interview_type,
        language=language,
        question_count=question_count,
        questions={"items": questions},
        answers={"items": []},
        status="active",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def evaluate_answer(
    db: Session,
    session: InterviewSession,
    question_index: int,
    question: str,
    answer: str,
) -> dict[str, Any]:
    """Evaluate a single answer and persist it to the session's answers list."""
    system_prompt, user_prompt = _build_eval_prompt(
        session.job_title,
        session.experience_level,
        session.language,
        question,
        answer,
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=get_rewrite_model_name(),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=EVAL_TEMPERATURE,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    evaluation = _extract_json(raw)

    # Normalise score to 0–10
    score = float(evaluation.get("score", 0))
    score = max(0.0, min(10.0, score))
    evaluation["score"] = round(score, 1)

    # Append to answers list
    answer_record: dict[str, Any] = {
        "index": question_index,
        "question": question,
        "answer": answer,
        "evaluation": evaluation,
    }

    current_answers: dict[str, Any] = dict(session.answers or {"items": []})
    items: list[dict[str, Any]] = list(current_answers.get("items", []))
    # Replace if same index (re-submit), otherwise append
    items = [a for a in items if a.get("index") != question_index]
    items.append(answer_record)
    items.sort(key=lambda x: x.get("index", 0))

    session.answers = {"items": items}
    db.add(session)
    db.commit()
    db.refresh(session)

    return evaluation


def complete_session(db: Session, session: InterviewSession) -> InterviewSession:
    """Generate final report and mark session as completed."""
    answers_list: list[dict[str, Any]] = (session.answers or {}).get("items", [])
    if not answers_list:
        raise ValueError("No answers recorded — cannot complete session.")

    scores = [
        float(a.get("evaluation", {}).get("score", 0))
        for a in answers_list
        if a.get("evaluation")
    ]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    # Build Q&A summary for the final prompt
    qa_lines: list[str] = []
    for item in answers_list:
        q = item.get("question", "")
        a = item.get("answer", "")
        s = item.get("evaluation", {}).get("score", "?")
        qa_lines.append(f"Q: {q}\nA: {a}\nScore: {s}/10")
    qa_summary = "\n\n".join(qa_lines)

    system_prompt, user_prompt = _build_final_report_prompt(
        session.job_title,
        session.experience_level,
        session.language,
        avg_score,
        qa_summary,
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=get_rewrite_model_name(),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=EVAL_TEMPERATURE,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    final_report = _extract_json(raw)

    # Ensure overall_score is set
    final_report["overall_score"] = avg_score

    session.overall_score = avg_score
    session.final_report = final_report
    session.status = "completed"
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


# ─── Queries ──────────────────────────────────────────────────────────────────

def get_session(db: Session, user_id: str, session_id: str) -> InterviewSession | None:
    return db.scalar(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id,
        )
    )


def list_sessions(db: Session, user_id: str) -> list[InterviewSession]:
    return list(
        db.scalars(
            select(InterviewSession)
            .where(InterviewSession.user_id == user_id)
            .order_by(InterviewSession.created_at.desc())
        )
    )

"""Service layer for AI-powered interview sessions."""

from __future__ import annotations

import json
import logging
from typing import Any, Generator

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.openai_client import get_openai_client
from app.models.interview import InterviewSession
from app.models.resume import Resume
from app.services.resume_preview import get_user_resume
from app.services.rewrite_engine import get_rewrite_model_name

logger = logging.getLogger(__name__)

INTERVIEW_TEMPERATURE = 0.7
EVAL_TEMPERATURE = 0.3
MAX_RESUME_CONTEXT_CHARS = 3200
MAX_JOB_DESCRIPTION_CHARS = 2600
MAX_HISTORY_ITEMS = 4

_LEVEL_LABELS = {
    "entry": "Entry Level (0-2 years)",
    "mid": "Mid Level (3-5 years)",
    "senior": "Senior Level (6+ years)",
}

_TYPE_LABELS = {
    "hr": "HR / Behavioral",
    "technical": "Technical",
    "mixed": "Mixed (HR + Technical)",
}

_TYPE_INSTRUCTIONS = {
    "hr": (
        "Focus on behavioral, situational, and competency-based questions. "
        "Probe for ownership, conflict handling, communication, judgment, and stakeholder management."
    ),
    "technical": (
        "Focus on role-specific skills, decisions, tools, tradeoffs, troubleshooting, and technical depth."
    ),
    "mixed": (
        "Balance behavioral and technical questions. Make the interview feel like a real hiring flow."
    ),
}

_STYLE_LABELS = {
    "supportive": "Supportive and encouraging",
    "direct": "Direct and professional",
    "challenging": "Challenging and demanding",
}

_STYLE_INSTRUCTIONS = {
    "supportive": (
        "Sound warm, calm, and professional. Push for clarity without sounding hostile."
    ),
    "direct": (
        "Sound concise, executive, and professional. Ask precise questions and keep the pace moving."
    ),
    "challenging": (
        "Sound demanding but fair. If an answer is vague, push for specifics, metrics, and accountability."
    ),
}


def _extract_json(raw: str) -> dict[str, Any]:
    """Strip markdown fences and parse JSON from model response."""
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)  # type: ignore[no-any-return]


def _trim_text(value: str | None, limit: int) -> str:
    if not value:
        return ""
    cleaned = value.strip()
    return cleaned[:limit]


def _get_resume_context_text(resume: Resume | None) -> str:
    if not resume:
        return ""
    return (resume.normalized_text or resume.raw_text or "").strip()


def _normalize_question(
    payload: dict[str, Any] | None,
    *,
    index: int,
    fallback_type: str,
    fallback_source: str,
) -> dict[str, Any]:
    raw_question = str((payload or {}).get("question", "")).strip()
    normalized_type = str((payload or {}).get("type", fallback_type)).strip().lower()
    normalized_source = str((payload or {}).get("source", fallback_source)).strip().lower()
    focus_area = str((payload or {}).get("focus_area", "")).strip() or None

    if normalized_type not in {"hr", "technical"}:
        normalized_type = fallback_type

    if normalized_source not in {"opening", "planned", "follow_up"}:
        normalized_source = fallback_source

    return {
        "index": index,
        "question": raw_question,
        "type": normalized_type,
        "source": normalized_source,
        "focus_area": focus_area,
    }


def _get_question_payload(session: InterviewSession) -> dict[str, Any]:
    return dict(session.questions or {})


def _get_question_items(session: InterviewSession) -> list[dict[str, Any]]:
    return list(_get_question_payload(session).get("items", []))


def _get_answer_items(session: InterviewSession) -> list[dict[str, Any]]:
    return list((session.answers or {}).get("items", []))


def _get_opening_message(session: InterviewSession) -> str | None:
    return _get_question_payload(session).get("opening_message")


def _get_context_summary(session: InterviewSession) -> dict[str, Any]:
    return dict(_get_question_payload(session).get("context_summary", {}))


def _save_question_payload(
    session: InterviewSession,
    *,
    items: list[dict[str, Any]],
    opening_message: str | None = None,
    context_summary: dict[str, Any] | None = None,
) -> None:
    session.questions = {
        "items": items,
        "opening_message": opening_message if opening_message is not None else _get_opening_message(session),
        "context_summary": context_summary if context_summary is not None else _get_context_summary(session),
    }


def _build_context_summary(
    *,
    resume: Resume | None,
    company_name: str | None,
    job_description: str | None,
    interviewer_style: str,
    focus_areas: list[str],
    target_role_summary: str | None,
) -> dict[str, Any]:
    return {
        "resume_id": resume.id if resume else None,
        "resume_title": (resume.source_filename or resume.title) if resume else None,
        "company_name": company_name,
        "interviewer_style": interviewer_style,
        "has_job_description": bool(job_description and job_description.strip()),
        "focus_areas": focus_areas[:5],
        "target_role_summary": target_role_summary,
    }


def _build_question_gen_prompt(
    *,
    job_title: str,
    experience_level: str,
    interview_type: str,
    language: str,
    company_name: str | None,
    job_description: str | None,
    resume: Resume | None,
    interviewer_style: str,
) -> tuple[str, str]:
    """Return (system_prompt, user_prompt) for session kickoff."""
    lang_instruction = "Write the full output in Arabic." if language == "ar" else "Write the full output in English."
    level_label = _LEVEL_LABELS.get(experience_level, experience_level)
    type_label = _TYPE_LABELS.get(interview_type, interview_type)
    style_label = _STYLE_LABELS.get(interviewer_style, interviewer_style)
    type_instruction = _TYPE_INSTRUCTIONS.get(interview_type, _TYPE_INSTRUCTIONS["mixed"])
    style_instruction = _STYLE_INSTRUCTIONS.get(interviewer_style, _STYLE_INSTRUCTIONS["supportive"])
    resume_text = _trim_text(_get_resume_context_text(resume), MAX_RESUME_CONTEXT_CHARS)
    job_description_text = _trim_text(job_description, MAX_JOB_DESCRIPTION_CHARS)

    company_line = f"Target company: {company_name}.\n" if company_name else ""
    resume_line = (
        "Candidate resume context:\n"
        f"{resume_text}\n\n"
        if resume_text
        else "Candidate resume context: not provided.\n\n"
    )
    jd_line = (
        "Target job description context:\n"
        f"{job_description_text}\n\n"
        if job_description_text
        else "Target job description context: not provided.\n\n"
    )

    system = (
        "You are simulating a realistic interview.\n"
        f"Role: {level_label} {job_title}.\n"
        f"Interview type: {type_label}.\n"
        f"Interviewer style: {style_label}.\n"
        f"{type_instruction}\n"
        f"{style_instruction}\n"
        f"{lang_instruction}\n\n"
        "Use the candidate context when available. Ground questions in the resume, target role, and expected job outcomes. "
        "Do not ask generic filler questions.\n\n"
        "Return ONLY valid JSON with this exact shape:\n"
        "{\n"
        '  "opening_message": "string",\n'
        '  "focus_areas": ["string", "string"],\n'
        '  "target_role_summary": "string",\n'
        '  "first_question": {\n'
        '    "question": "string",\n'
        '    "type": "hr",\n'
        '    "source": "opening",\n'
        '    "focus_area": "string"\n'
        "  }\n"
        "}\n\n"
        "Rules:\n"
        "- opening_message: 1-2 short interviewer sentences starting the interview naturally.\n"
        "- focus_areas: 3-5 concrete competencies to test during the interview.\n"
        "- target_role_summary: one concise line summarizing what success in this role looks like.\n"
        "- first_question: must feel realistic and specific to the role.\n"
        "- If a resume is present, the first question should preferably connect to a likely claim, project, or achievement from it.\n"
        "- first_question.type must be either 'hr' or 'technical'.\n"
        "- first_question.source must be 'opening'."
    )

    user = (
        f"Generate a realistic interview kickoff for {job_title}.\n"
        f"{company_line}"
        f"{resume_line}"
        f"{jd_line}"
        f"Candidate level: {level_label}.\n"
        f"Interview mode: {type_label}.\n"
        f"Interviewer style: {style_label}."
    )
    return system, user


def _format_transcript_for_prompt(answers: list[dict[str, Any]]) -> str:
    if not answers:
        return "No previous answers yet."

    selected_answers = answers[-MAX_HISTORY_ITEMS:]
    transcript_lines: list[str] = []
    for item in selected_answers:
        evaluation = item.get("evaluation", {})
        transcript_lines.append(
            f"Question {int(item.get('index', 0)) + 1}: {item.get('question', '')}\n"
            f"Candidate answer: {item.get('answer', '')}\n"
            f"Score: {evaluation.get('score', 0)}/10\n"
            f"Main weaknesses: {', '.join(evaluation.get('weaknesses', [])) or 'none'}"
        )
    return "\n\n".join(transcript_lines)


def _build_eval_prompt(
    *,
    session: InterviewSession,
    question: str,
    answer: str,
    remaining_questions: int,
) -> tuple[str, str]:
    """Return (system_prompt, user_prompt) for a single turn evaluation."""
    context_summary = _get_context_summary(session)
    level_label = _LEVEL_LABELS.get(session.experience_level, session.experience_level)
    type_label = _TYPE_LABELS.get(session.interview_type, session.interview_type)
    style = context_summary.get("interviewer_style") or "supportive"
    style_label = _STYLE_LABELS.get(style, style)
    style_instruction = _STYLE_INSTRUCTIONS.get(style, _STYLE_INSTRUCTIONS["supportive"])
    lang_note = "Write all output in Arabic." if session.language == "ar" else "Write all output in English."
    focus_areas = context_summary.get("focus_areas") or []
    transcript = _format_transcript_for_prompt(_get_answer_items(session))
    company_name = context_summary.get("company_name")
    resume_title = context_summary.get("resume_title")
    target_role_summary = context_summary.get("target_role_summary")

    system = (
        "You are acting as a realistic interviewer and an evaluator at the same time.\n"
        f"Role: {level_label} {session.job_title}.\n"
        f"Interview type: {type_label}.\n"
        f"Interviewer style: {style_label}.\n"
        f"{style_instruction}\n"
        f"{lang_note}\n\n"
        "Evaluate the candidate answer across these dimensions:\n"
        "- Relevance\n"
        "- Clarity\n"
        "- Professionalism\n"
        "- Confidence\n"
        "- Role-fit\n\n"
        "Then decide what the interviewer should say next and what the next question should be.\n"
        "If the answer is vague, weak, or missing evidence, use a follow-up question that probes deeper. "
        "If the answer is solid, move to another competency that has not been covered yet.\n\n"
        "Return ONLY valid JSON with this exact shape:\n"
        "{\n"
        '  "interviewer_reply": "string",\n'
        '  "score": 7.4,\n'
        '  "star_score": 6.5,\n'
        '  "strengths": ["string"],\n'
        '  "weaknesses": ["string"],\n'
        '  "improved_answer": "string",\n'
        '  "communication_tip": "string",\n'
        '  "next_question": {\n'
        '    "question": "string",\n'
        '    "type": "technical",\n'
        '    "source": "follow_up",\n'
        '    "focus_area": "string"\n'
        "  }\n"
        "}\n\n"
        "Rules:\n"
        "- score must be a float from 0 to 10 with one decimal place.\n"
        "- star_score: a float 0–10 rating how well the answer follows the STAR method "
        "(Situation, Task, Action, Result). Set to null if the question is purely technical "
        "(e.g. coding, architecture) with no behavioral component.\n"
        "- strengths: 2-3 specific positives.\n"
        "- weaknesses: 1-3 specific gaps. Use [] only when the answer is genuinely strong.\n"
        "- improved_answer: keep the same facts, improve structure and specificity. Apply STAR format where applicable.\n"
        "- interviewer_reply: 1-2 short sentences that sound like a real interviewer responding live.\n"
        "- communication_tip: one focused coaching note.\n"
        f"- There are {remaining_questions} remaining interview slots after this answer.\n"
        "- If there are 0 remaining slots, set next_question to null.\n"
        "- next_question.type must be 'hr' or 'technical'.\n"
        "- next_question.source must be 'follow_up' or 'planned'.\n"
        "- Avoid repeating previous questions."
    )

    user = (
        f"Target company: {company_name or 'Not provided'}\n"
        f"Resume title: {resume_title or 'Not provided'}\n"
        f"Role summary: {target_role_summary or 'Not provided'}\n"
        f"Focus areas still important: {', '.join(focus_areas) if focus_areas else 'General role fit'}\n\n"
        f"Recent transcript:\n{transcript}\n\n"
        f"Current question:\n{question}\n\n"
        f"Candidate answer:\n{answer}"
    )
    return system, user


def _build_final_report_prompt(
    *,
    session: InterviewSession,
    avg_score: float,
    qa_summary: str,
) -> tuple[str, str]:
    """Return (system_prompt, user_prompt) for the final interview report."""
    context_summary = _get_context_summary(session)
    level_label = _LEVEL_LABELS.get(session.experience_level, session.experience_level)
    response_lang = "Write the report in Arabic." if session.language == "ar" else "Write the report in English."

    system = (
        "You are a senior hiring manager writing a final mock-interview coaching report.\n"
        f"Role: {level_label} {session.job_title}.\n"
        f"Average score: {avg_score:.1f}/10.\n"
        f"{response_lang}\n\n"
        "Return ONLY valid JSON with this exact shape:\n"
        "{\n"
        f'  "overall_score": {avg_score:.1f},\n'
        '  "readiness": "Good Progress",\n'
        '  "summary": "string",\n'
        '  "breakdown": {\n'
        '    "relevance": 7.5,\n'
        '    "clarity": 7.0,\n'
        '    "professionalism": 8.0,\n'
        '    "confidence": 6.5,\n'
        '    "role_fit": 7.5\n'
        "  },\n"
        '  "top_strengths": ["string"],\n'
        '  "priority_improvements": ["string"],\n'
        '  "recommended_drills": ["string"]\n'
        "}\n\n"
        "Rules:\n"
        "- readiness must be one of: Needs Improvement, Good Progress, Interview Ready.\n"
        "- summary should be 2-4 sentences.\n"
        "- breakdown values must be floats from 0 to 10.\n"
        "- top_strengths: 2-4 concrete strengths shown in the session.\n"
        "- priority_improvements: 2-4 highest-impact improvements.\n"
        "- recommended_drills: 3 short practice drills the candidate should do next."
    )

    user = (
        f"Company: {context_summary.get('company_name') or 'Not provided'}\n"
        f"Resume used: {context_summary.get('resume_title') or 'Not provided'}\n"
        f"Role summary: {context_summary.get('target_role_summary') or 'Not provided'}\n"
        f"Interview focus areas: {', '.join(context_summary.get('focus_areas') or []) or 'General role fit'}\n\n"
        f"Session transcript summary:\n{qa_summary}"
    )
    return system, user


def _build_fallback_next_question(session: InterviewSession, question_index: int) -> dict[str, Any]:
    """Keep the interview moving if the model omits the next question."""
    context_summary = _get_context_summary(session)
    focus_areas = [str(item).strip() for item in context_summary.get("focus_areas", []) if str(item).strip()]
    focus_area = focus_areas[min(question_index, len(focus_areas) - 1)] if focus_areas else "role-fit"

    if session.interview_type == "technical":
        question_text = (
            f"Walk me through a concrete example that shows your depth in {focus_area} "
            f"for a {session.job_title} role."
        )
        question_type = "technical"
    elif session.interview_type == "hr":
        question_text = (
            f"Tell me about a time you demonstrated strong {focus_area} in a work situation. "
            "What was your exact role and outcome?"
        )
        question_type = "hr"
    else:
        if question_index % 2 == 0:
            question_text = (
                f"Tell me about a time you demonstrated strong {focus_area} in a work situation. "
                "What did you personally do?"
            )
            question_type = "hr"
        else:
            question_text = (
                f"Walk me through a concrete example that shows your depth in {focus_area} "
                f"for a {session.job_title} role."
            )
            question_type = "technical"

    return {
        "question": question_text,
        "type": question_type,
        "source": "planned",
        "focus_area": focus_area,
    }


def create_session(
    db: Session,
    user_id: str,
    job_title: str,
    experience_level: str,
    interview_type: str,
    language: str,
    question_count: int,
    resume_id: str | None = None,
    company_name: str | None = None,
    job_description: str | None = None,
    interviewer_style: str = "supportive",
) -> InterviewSession:
    """Create session, generate the opening and first question, persist and return."""
    resume = get_user_resume(db, user_id, resume_id) if resume_id else None
    system_prompt, user_prompt = _build_question_gen_prompt(
        job_title=job_title,
        experience_level=experience_level,
        interview_type=interview_type,
        language=language,
        company_name=company_name,
        job_description=job_description,
        resume=resume,
        interviewer_style=interviewer_style,
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
    opening_message = str(payload.get("opening_message", "")).strip() or None
    focus_areas = [str(item).strip() for item in payload.get("focus_areas", []) if str(item).strip()]
    target_role_summary = str(payload.get("target_role_summary", "")).strip() or None
    first_question = _normalize_question(
        payload.get("first_question"),
        index=0,
        fallback_type="hr" if interview_type != "technical" else "technical",
        fallback_source="opening",
    )

    if not first_question["question"]:
        raise ValueError("The interview engine did not return a usable opening question.")

    context_summary = _build_context_summary(
        resume=resume,
        company_name=company_name,
        job_description=job_description,
        interviewer_style=interviewer_style,
        focus_areas=focus_areas,
        target_role_summary=target_role_summary,
    )

    session = InterviewSession(
        user_id=user_id,
        job_title=job_title,
        experience_level=experience_level,
        interview_type=interview_type,
        language=language,
        question_count=question_count,
        questions={
            "items": [first_question],
            "opening_message": opening_message,
            "context_summary": context_summary,
        },
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
    """Evaluate one answer, persist it, and generate the next interview question dynamically."""
    current_answers = _get_answer_items(session)
    current_questions = _get_question_items(session)
    existing_answer_count = len([item for item in current_answers if item.get("index") != question_index])
    remaining_questions = max(session.question_count - (existing_answer_count + 1), 0)

    system_prompt, user_prompt = _build_eval_prompt(
        session=session,
        question=question,
        answer=answer,
        remaining_questions=remaining_questions,
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
    payload = _extract_json(raw)

    score = float(payload.get("score", 0))
    raw_star = payload.get("star_score")
    star_score = round(max(0.0, min(10.0, float(raw_star))), 1) if raw_star is not None else None
    evaluation = {
        "score": round(max(0.0, min(10.0, score)), 1),
        "star_score": star_score,
        "strengths": [str(item).strip() for item in payload.get("strengths", []) if str(item).strip()],
        "weaknesses": [str(item).strip() for item in payload.get("weaknesses", []) if str(item).strip()],
        "improved_answer": str(payload.get("improved_answer", "")).strip(),
        "interviewer_reply": str(payload.get("interviewer_reply", "")).strip(),
        "communication_tip": str(payload.get("communication_tip", "")).strip() or None,
    }

    answer_record: dict[str, Any] = {
        "index": question_index,
        "question": question,
        "answer": answer,
        "evaluation": evaluation,
    }

    next_question: dict[str, Any] | None = None
    if remaining_questions > 0:
        next_question = _normalize_question(
            payload.get("next_question"),
            index=len(current_questions),
            fallback_type="technical" if session.interview_type == "technical" else "hr",
            fallback_source="planned",
        )
        if not next_question["question"]:
            next_question = _normalize_question(
                _build_fallback_next_question(session, len(current_questions)),
                index=len(current_questions),
                fallback_type="technical" if session.interview_type == "technical" else "hr",
                fallback_source="planned",
            )

    updated_answers = [item for item in current_answers if item.get("index") != question_index]
    updated_answers.append(answer_record)
    updated_answers.sort(key=lambda item: int(item.get("index", 0)))
    session.answers = {"items": updated_answers}

    if next_question and len(current_questions) <= next_question["index"]:
        current_questions.append(next_question)

    _save_question_payload(session, items=current_questions)
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "evaluation": evaluation,
        "questions": _get_question_items(session),
        "next_question": next_question,
    }


def complete_session(db: Session, session: InterviewSession) -> InterviewSession:
    """Generate final report and mark session as completed."""
    answers_list = _get_answer_items(session)
    if not answers_list:
        raise ValueError("No answers recorded - cannot complete session.")

    scores = [
        float(item.get("evaluation", {}).get("score", 0))
        for item in answers_list
        if item.get("evaluation")
    ]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    qa_lines: list[str] = []
    for item in answers_list:
        evaluation = item.get("evaluation", {})
        qa_lines.append(
            f"Question {int(item.get('index', 0)) + 1}: {item.get('question', '')}\n"
            f"Candidate answer: {item.get('answer', '')}\n"
            f"Score: {evaluation.get('score', 0)}/10\n"
            f"Strengths: {', '.join(evaluation.get('strengths', [])) or 'none'}\n"
            f"Weaknesses: {', '.join(evaluation.get('weaknesses', [])) or 'none'}"
        )
    qa_summary = "\n\n".join(qa_lines)

    system_prompt, user_prompt = _build_final_report_prompt(
        session=session,
        avg_score=avg_score,
        qa_summary=qa_summary,
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
    final_report["overall_score"] = avg_score

    readiness = str(final_report.get("readiness", "")).strip()
    if readiness not in {"Needs Improvement", "Good Progress", "Interview Ready"}:
        final_report["readiness"] = (
            "Needs Improvement" if avg_score < 5 else "Good Progress" if avg_score < 7.5 else "Interview Ready"
        )

    breakdown = dict(final_report.get("breakdown", {}))
    final_report["breakdown"] = {
        "relevance": round(float(breakdown.get("relevance", avg_score)), 1),
        "clarity": round(float(breakdown.get("clarity", avg_score)), 1),
        "professionalism": round(float(breakdown.get("professionalism", avg_score)), 1),
        "confidence": round(float(breakdown.get("confidence", avg_score)), 1),
        "role_fit": round(float(breakdown.get("role_fit", avg_score)), 1),
    }
    final_report["top_strengths"] = [
        str(item).strip() for item in final_report.get("top_strengths", []) if str(item).strip()
    ]
    final_report["priority_improvements"] = [
        str(item).strip() for item in final_report.get("priority_improvements", []) if str(item).strip()
    ]
    final_report["recommended_drills"] = [
        str(item).strip() for item in final_report.get("recommended_drills", []) if str(item).strip()
    ]
    final_report["summary"] = str(final_report.get("summary", "")).strip()

    session.overall_score = avg_score
    session.final_report = final_report
    session.status = "completed"
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


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


def stream_evaluate_answer(
    db: Session,
    session: InterviewSession,
    question_index: int,
    question: str,
    answer: str,
) -> Generator[str, None, None]:
    """Stream evaluation tokens as SSE, then persist and emit a done event."""
    current_answers = _get_answer_items(session)
    current_questions = _get_question_items(session)
    existing_answer_count = len([item for item in current_answers if item.get("index") != question_index])
    remaining_questions = max(session.question_count - (existing_answer_count + 1), 0)

    system_prompt, user_prompt = _build_eval_prompt(
        session=session,
        question=question,
        answer=answer,
        remaining_questions=remaining_questions,
    )

    client = get_openai_client()
    full_text = ""
    try:
        stream = client.chat.completions.create(
            model=get_rewrite_model_name(),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=EVAL_TEMPERATURE,
            response_format={"type": "json_object"},
            stream=True,
        )
        for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            if token:
                full_text += token
                yield f"data: {json.dumps({'type': 'chunk', 'text': token})}\n\n"
    except Exception as exc:
        logger.error("Streaming eval error: %s", exc)
        yield f"data: {json.dumps({'type': 'error', 'detail': 'Evaluation failed. Please try again.'})}\n\n"
        return

    try:
        payload = _extract_json(full_text)
    except Exception:
        yield f"data: {json.dumps({'type': 'error', 'detail': 'Could not parse evaluation response.'})}\n\n"
        return

    score = float(payload.get("score", 0))
    raw_star = payload.get("star_score")
    star_score = round(max(0.0, min(10.0, float(raw_star))), 1) if raw_star is not None else None
    evaluation = {
        "score": round(max(0.0, min(10.0, score)), 1),
        "star_score": star_score,
        "strengths": [str(item).strip() for item in payload.get("strengths", []) if str(item).strip()],
        "weaknesses": [str(item).strip() for item in payload.get("weaknesses", []) if str(item).strip()],
        "improved_answer": str(payload.get("improved_answer", "")).strip(),
        "interviewer_reply": str(payload.get("interviewer_reply", "")).strip(),
        "communication_tip": str(payload.get("communication_tip", "")).strip() or None,
    }

    answer_record: dict[str, Any] = {
        "index": question_index,
        "question": question,
        "answer": answer,
        "evaluation": evaluation,
    }

    next_question: dict[str, Any] | None = None
    if remaining_questions > 0:
        next_question = _normalize_question(
            payload.get("next_question"),
            index=len(current_questions),
            fallback_type="technical" if session.interview_type == "technical" else "hr",
            fallback_source="planned",
        )
        if not next_question["question"]:
            next_question = _normalize_question(
                _build_fallback_next_question(session, len(current_questions)),
                index=len(current_questions),
                fallback_type="technical" if session.interview_type == "technical" else "hr",
                fallback_source="planned",
            )

    updated_answers = [item for item in current_answers if item.get("index") != question_index]
    updated_answers.append(answer_record)
    updated_answers.sort(key=lambda item: int(item.get("index", 0)))
    session.answers = {"items": updated_answers}

    if next_question and len(current_questions) <= next_question["index"]:
        current_questions.append(next_question)

    _save_question_payload(session, items=current_questions)
    db.add(session)
    db.commit()
    db.refresh(session)

    result: dict[str, Any] = {
        "question_index": question_index,
        "evaluation": evaluation,
        "questions": _get_question_items(session),
        "next_question": next_question,
    }
    yield f"data: {json.dumps({'type': 'done', 'payload': result})}\n\n"

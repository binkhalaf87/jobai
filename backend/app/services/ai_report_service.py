"""Service layer for AI-powered free-form resume analysis reports."""

import json
from datetime import datetime, timezone
from typing import Generator

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.openai_client import get_openai_client
from app.models.ai_report import AIAnalysisReport
from app.models.resume import Resume
from app.services.rewrite_engine import get_rewrite_model_name

AI_REPORT_MAX_TOKENS = 4096
AI_REPORT_TEMPERATURE = 0.3

SYSTEM_PROMPT = """\
You are an expert Recruiter, HR Manager, and ATS (Applicant Tracking System) specialist.
Your task is to analyze the resume I provide and produce a professional report following the structure,
style, and format described below — using clear section headings, organized tables, rating scores,
and actionable recommendations.

=== STRICT OUTPUT RULES ===
- Language: English.
- Style: Professional, clear, and structured — use headings, tables, and concise bullet points.
- Do NOT fabricate any information not present in the resume.
- Use markdown formatting: ## for section headings, **bold** for labels, tables with | pipes |.

=== REPORT STRUCTURE (follow this order exactly) ===

## Section 1 — Executive Summary
1–3 paragraphs covering:
- Quick overall assessment of the candidate
- Most suitable roles
- Top 3 strengths
- Top 3 gaps / hiring risks

## Section 2 — ATS Match Score (0–100)
Display the score as: **ATS Score: XX/100**
Then provide a detailed table with these exact columns:
| Criterion | Current Status | Issue | Suggested Improvement |
Cover at minimum: Formatting & Machine Readability, Sections & Headings,
Keywords vs. Target Role, Experience (Achievements & Numbers),
Education & Certifications, Technical / Functional Skills, Personal & Contact Information.
Do NOT include a keyword map section.

## Section 3 — Professional Analysis from a Hiring Manager's Perspective
Rate each dimension with a score (0–10) and a practical comment:
| Dimension | Score | Comment |
Dimensions: First Impression, Career Path Clarity, Strength of Achievements & Impact,
Fit for Target Role, Presentation Professionalism.

## Section 4 — Career Recommendations & Saudi Labor Market Guidance
- Top 3–5 most suitable roles + rationale
- 30 / 60 / 90-Day Development Plan (concise and actionable)
- Recommended courses / certifications (role-specific)
- LinkedIn / Portfolio improvement tips if applicable
Do NOT include any section about recommended companies or sectors.

## Section 5 — Quick Wins Checklist
10–15 prioritized action items (High / Medium / Low priority).
Write as direct instructions: "Do X" — not "It is recommended to…"
Format as a table: | Priority | Action |

## Section 6 — Expected Interview Questions & Suggested Answers
8–12 common questions relevant to the target role.
For each question: provide a 3–5 line answer framework.
Format: **Q: [question]** followed by the answer framework.

=== ACCURACY & INTEGRITY RULES ===
- Never fabricate experience, companies, or certifications.
- If you find date conflicts or employment gaps: flag them as a **Note** and suggest professional phrasing.
- All recommendations must be immediately actionable.\
"""


def build_user_message(resume_text: str, job_description: str | None, country: str = "Saudi Arabia") -> str:
    """Compose the user turn combining the resume and optional job description."""
    lines = [f"**Resume Text:**\n\n{resume_text.strip()}"]

    if job_description and job_description.strip():
        lines.append(f"\n**Target Job Description:**\n\n{job_description.strip()}")
    else:
        lines.append(
            f"\n**Job Description:** Not provided. "
            f"Please select a suitable sample role based on the candidate's profile within the {country} market."
        )

    return "\n".join(lines)


def create_pending_report(
    db: Session,
    user_id: str,
    resume: Resume,
    job_description: str | None,
) -> AIAnalysisReport:
    """Persist a pending report record before streaming starts."""
    report = AIAnalysisReport(
        user_id=user_id,
        resume_id=resume.id,
        resume_title=resume.source_filename or resume.title,
        job_description_text=job_description,
        model_name=get_rewrite_model_name(),
        status="pending",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_user_report(db: Session, user_id: str, report_id: str) -> AIAnalysisReport | None:
    """Load a report that belongs to the current user."""
    return db.scalar(
        select(AIAnalysisReport).where(
            AIAnalysisReport.id == report_id,
            AIAnalysisReport.user_id == user_id,
        )
    )


def list_user_reports(db: Session, user_id: str) -> list[AIAnalysisReport]:
    """Return all reports for the user, newest first."""
    return list(
        db.scalars(
            select(AIAnalysisReport)
            .where(AIAnalysisReport.user_id == user_id)
            .order_by(AIAnalysisReport.created_at.desc())
        )
    )


def stream_report_to_client(
    report_id: str,
    resume_text: str,
    job_description: str | None,
) -> Generator[str, None, None]:
    """
    Stream SSE events to the client while calling OpenAI.
    Saves the completed text to the DB when the stream finishes.
    Uses its own SessionLocal so the request session is not held open.
    """
    from app.db.session import SessionLocal  # local import to avoid circular deps

    full_text = ""

    # Send the report_id immediately so the frontend can reference it
    yield f"data: {json.dumps({'type': 'id', 'report_id': report_id})}\n\n"

    try:
        client = get_openai_client()
        stream = client.chat.completions.create(
            model=get_rewrite_model_name(),
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_message(resume_text, job_description)},
            ],
            stream=True,
            temperature=AI_REPORT_TEMPERATURE,
            max_tokens=AI_REPORT_MAX_TOKENS,
        )

        for chunk in stream:
            content = chunk.choices[0].delta.content or ""
            if content:
                full_text += content
                yield f"data: {json.dumps({'type': 'chunk', 'text': content})}\n\n"

        # Persist completed report in a fresh session
        with SessionLocal() as save_db:
            report = save_db.scalar(
                select(AIAnalysisReport).where(AIAnalysisReport.id == report_id)
            )
            if report:
                report.report_text = full_text
                report.status = "completed"
                report.completed_at = datetime.now(timezone.utc)
                save_db.commit()

        yield f"data: {json.dumps({'type': 'done', 'report_id': report_id})}\n\n"

    except Exception as exc:
        # Mark report as failed
        try:
            with SessionLocal() as fail_db:
                report = fail_db.scalar(
                    select(AIAnalysisReport).where(AIAnalysisReport.id == report_id)
                )
                if report:
                    report.status = "failed"
                    fail_db.commit()
        except Exception:
            pass

        yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

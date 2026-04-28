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

AI_REPORT_MAX_TOKENS = 6000
AI_REPORT_TEMPERATURE = 0.3

ANALYSIS_SYSTEM_PROMPT = """\
You are an expert Recruiter, HR Manager, and ATS (Applicant Tracking System) specialist.
Your task is to analyze the resume I provide and produce a professional report following the structure,
style, and format described below — using clear section headings, organized tables, rating scores,
and actionable recommendations.

=== STRICT OUTPUT RULES ===
- Language: You MUST write the entire report in the language the user specifies at the top of their message. This overrides everything else. If the user specifies Arabic, every word must be in Arabic. If not specified, use English.
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
- Recommended courses / certifications (role-specific)
- LinkedIn / Portfolio improvement tips if applicable
Do NOT include any section about recommended companies or sectors.
Do NOT include a 30/60/90-day development plan.

## Section 5 — Quick Wins Checklist
10–15 prioritized action items (High / Medium / Low priority).
Write as direct instructions: "Do X" — not "It is recommended to…"
Format as a table: | Priority | Action |

## Section 6 — Expected Interview Questions & Suggested Answers
8–12 common questions relevant to the target role.
For each question: provide a 3–5 line answer framework.
Format: **Q: [question]** followed by the answer framework.

## Section 7 — Salary Insights & Market Benchmarks
Provide realistic salary benchmarks for the top 3–5 recommended roles in the Saudi/GCC market (or the region implied by the candidate's profile).
Format as a table with these exact columns:
| Role | Entry Level (SAR/month) | Mid Level (SAR/month) | Senior Level (SAR/month) | Market Demand |
- Market Demand values: High / Medium / Low
- Use realistic current Saudi market ranges (e.g. 8,000–12,000 / 12,000–18,000 / 18,000–30,000+)
- After the table, add 2–3 bullet points about key factors that affect salary in this field (certifications, company size, city, Vision 2030 impact).
- If the candidate's profile is outside Saudi Arabia, adjust the salary ranges to the relevant regional market.

=== ACCURACY & INTEGRITY RULES ===
- Never fabricate experience, companies, or certifications.
- If you find date conflicts or employment gaps: flag them as a **Note** and suggest professional phrasing.
- All recommendations must be immediately actionable.\
"""

ENHANCEMENT_SYSTEM_PROMPT = """\
You are an expert Resume Writer, Career Coach, and ATS Optimization Specialist with deep knowledge of the Saudi and GCC job markets. Your task is to rewrite the resume I provide into a polished, professional, and ATS-optimized version — without inventing any information.

1) Core Rules

Rewrite only what exists in the original resume — do not fabricate experience, titles, companies, dates, or certifications.
If a detail is missing but important (e.g., a metric or city): write [value needed] or [please confirm].
Language: English (unless I specify otherwise).
Do NOT use complex tables or text boxes in the resume — keep formatting ATS-safe (plain, clean structure).
Use strong, active action verbs to open every bullet point.
Every experience bullet must follow the STAR format (Situation → Task → Action → Result) and include quantifiable impact wherever possible.

2) Inputs I Will Provide

The original resume (text or file).
(Optional) A target Job Description.
(Optional) Target country/market (default: Saudi Arabia).

If no job description is provided: tailor the resume toward the most suitable role based on the candidate's background and the Saudi job market.

3) Rewritten Resume Structure (in this exact order)

**Header**
Full Name
City, Country | Phone | Professional Email | LinkedIn URL

**Professional Summary**
3–4 lines. Must include:
- Years of experience
- Core area of expertise
- 2–3 key strengths or differentiators
- A clear value proposition for the employer
- Naturally embed 4–6 high-impact keywords from the target role

**Key Skills**
Organized into three categories (use only what applies):
- Technical Skills: tools, software, platforms, programming languages
- Functional Skills: core competencies, domain expertise, methodologies
- Soft Skills: leadership, communication, problem-solving (limit to 3–4 genuinely relevant ones)
Format as a clean keyword-rich list — no paragraphs.

**Professional Experience**
For each position:
Job Title | Company Name | City, Country | Month Year – Month Year (or Present)
4–6 bullet points per role:
- Start with a strong action verb (Led, Built, Reduced, Grew, Designed, Implemented…)
- Describe the action taken and its context
- End with a measurable result: %, $, time saved, team size, rank, scale
- If no metric is available: write [result: please confirm] — do not guess.

**Education**
Degree | Major | Institution Name | City, Country | Graduation Year

**Certifications & Courses**
Certification Name | Issuing Body | Year
(List only what is confirmed in the original resume)

**Projects** (if applicable)
Project Name | Brief description (1–2 lines) | Tools/Technologies used | Impact or outcome

**Languages**
Language — Proficiency Level (Native / Fluent / Professional / Basic)

4) Language & Style Guidelines

- Use varied, powerful action verbs — never repeat the same verb more than twice.
- Write in third-person implied style (no "I" or "my").
- Keep bullet points between 1.5–2.5 lines — not too short, not too long.
- Eliminate all filler phrases: "responsible for," "worked on," "helped with," "assisted in."
- Replace weak language with impact-driven alternatives:
  ❌ "Responsible for managing a team" → ✅ "Led a cross-functional team of [X] to deliver [outcome]"
  ❌ "Helped with customer service" → ✅ "Resolved an average of [X] customer escalations per week, achieving [X]% satisfaction rate"
- Ensure smooth, natural language — not robotic or keyword-stuffed.

5) ATS Optimization Rules

- Use standard section titles: Experience, Education, Skills, Certifications — not creative alternatives.
- Embed relevant keywords naturally throughout the summary, skills, and bullets — match terminology from the target job description.
- Avoid: headers/footers, text boxes, columns, tables, images, graphics, icons.
- Use simple formatting: plain bullet points (•), bold for titles only, consistent date format.
- File should read cleanly top-to-bottom in a single column.

6) Final Quality Check (apply before outputting)
Before delivering the rewritten resume, verify:
- Every bullet starts with a strong action verb
- At least 70% of bullets contain a measurable result or metric
- No information was fabricated
- Keywords from the target role are naturally embedded
- No filler language remains
- Formatting is clean and ATS-safe
- Professional Summary clearly communicates the candidate's value\
"""

# Keep the old name as an alias for backward compatibility
SYSTEM_PROMPT = ANALYSIS_SYSTEM_PROMPT


def _get_system_prompt(report_type: str) -> str:
    return ENHANCEMENT_SYSTEM_PROMPT if report_type == "enhancement" else ANALYSIS_SYSTEM_PROMPT


_LANGUAGE_INSTRUCTIONS: dict[str, str] = {
    "Arabic": (
        "CRITICAL LANGUAGE REQUIREMENT: You MUST write the ENTIRE report exclusively in Arabic (العربية). "
        "Every single word — all headings, table headers, table content, bullet points, scores, labels, "
        "recommendations, and explanations — must be written in Arabic. Do NOT use English anywhere in the report."
    ),
    "English": "Write the entire report in English.",
}


def build_user_message(
    resume_text: str,
    job_description: str | None,
    country: str = "Saudi Arabia",
    language: str = "English",
) -> str:
    """Compose the user turn combining the resume and optional job description."""
    lang_instruction = _LANGUAGE_INSTRUCTIONS.get(language, f"Write the entire report in {language}.")
    lines = [f"**Report Language:** {language}\n\n{lang_instruction}"]
    lines.append(f"\n**Resume Text:**\n\n{resume_text.strip()}")

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
    report_type: str = "analysis",
) -> AIAnalysisReport:
    """Persist a pending report record before streaming starts."""
    report = AIAnalysisReport(
        user_id=user_id,
        resume_id=resume.id,
        resume_title=resume.source_filename or resume.title,
        job_description_text=job_description,
        model_name=get_rewrite_model_name(),
        report_type=report_type,
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


def list_user_reports(db: Session, user_id: str, report_type: str | None = None) -> list[AIAnalysisReport]:
    """Return reports for the user, newest first. Optionally filter by report_type."""
    query = select(AIAnalysisReport).where(AIAnalysisReport.user_id == user_id)
    if report_type is not None:
        query = query.where(AIAnalysisReport.report_type == report_type)
    return list(db.scalars(query.order_by(AIAnalysisReport.created_at.desc())))


def stream_report_to_client(
    report_id: str,
    resume_text: str,
    job_description: str | None,
    report_type: str = "analysis",
    language: str = "English",
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
                {"role": "system", "content": _get_system_prompt(report_type)},
                {"role": "user", "content": build_user_message(resume_text, job_description, language=language)},
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

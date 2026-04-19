"""Auto-generate a structured screening report (Senior Recruiter prompt)."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.openai_client import get_openai_client
from app.models.ai_report import AIAnalysisReport
from app.models.resume import Resume
from app.services.gpt_matching_service import GPT_MATCH_MODEL

logger = logging.getLogger(__name__)

REPORT_TYPE = "screening"

_SYSTEM_PROMPT = """\
Act as a Senior Recruiter + Intelligent Evaluation System.

Task:
Analyze the resume and produce a structured screening report + a semi-automated hiring decision.

Return ONLY a valid JSON object with the exact structure below — no markdown, no extra text.

{
  "executive_summary": "max 3 lines: who the candidate is + years of experience + domain + key strength",
  "scores": {
    "relevant_experience": <number 1-10>,
    "core_skills_match": <number 1-10>,
    "stability": <number 1-10>,
    "growth_and_progression": <number 1-10>,
    "role_fit": <number 1-10>,
    "final_score": <average of the 5 scores, one decimal>
  },
  "decision": "Strong Hire" or "Consider" or "Weak" or "Reject",
  "why_hire": ["clear reason 1", "clear reason 2", "clear reason 3"],
  "risks": ["key risk or gap 1", "key risk or gap 2", "key risk or gap 3"],
  "recommendation": {
    "decision": "Strong Hire" or "Consider" or "Weak" or "Reject",
    "action": "Move Forward" or "Hold" or "Reject",
    "reason": "one line brief reason"
  },
  "quick_flags": ["flag1", "flag2"]
}

Decision Logic (apply strictly based on final_score):
- final_score >= 8.0 → "Strong Hire"
- final_score >= 6.0 → "Consider"
- final_score >= 4.0 → "Weak"
- final_score < 4.0  → "Reject"

Available quick_flags (pick only what applies):
Overqualified, Underqualified, Job Hopper, High Potential, Skill Gap,
Career Changer, Leadership Ready, Entry Level, Senior Level

Rules:
- Be concise, direct, and firm
- Use bullet-style thinking for each criterion
- Focus purely on hiring decision quality
- Do NOT fabricate experience not present in the resume
- Return ONLY valid JSON\
"""


def run_screening_report_task(resume_id: str, user_id: str, force: bool = False) -> None:
    """Background task: generate a screening report for *resume_id*.

    force=True deletes any existing completed report before re-running.
    """
    from app.db.session import SessionLocal

    db: Session = SessionLocal()
    report: AIAnalysisReport | None = None

    try:
        resume = db.get(Resume, resume_id)
        if not resume:
            return

        resume_text = (resume.normalized_text or resume.raw_text or "").strip()
        if not resume_text:
            return

        existing = db.scalar(
            select(AIAnalysisReport)
            .where(
                AIAnalysisReport.resume_id == resume_id,
                AIAnalysisReport.report_type == REPORT_TYPE,
            )
            .order_by(AIAnalysisReport.created_at.desc())
            .limit(1)
        )
        if existing and existing.status == "completed":
            if not force:
                return
            db.delete(existing)
            db.commit()
            existing = None

        if existing and existing.status == "pending":
            report = existing
        else:
            report = AIAnalysisReport(
                user_id=user_id,
                resume_id=resume_id,
                resume_title=resume.source_filename or resume.title,
                job_description_text=None,
                model_name=GPT_MATCH_MODEL,
                report_type=REPORT_TYPE,
                status="pending",
            )
            db.add(report)
            db.commit()
            db.refresh(report)

        client = get_openai_client()
        response = client.chat.completions.create(
            model=GPT_MATCH_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": f"Resume:\n\n{resume_text}"},
            ],
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )

        raw = (response.choices[0].message.content or "").strip()
        parsed = json.loads(raw)

        report.report_text = json.dumps(parsed, ensure_ascii=False)
        report.status = "completed"
        report.completed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception:
        logger.exception("Screening report failed for resume %s", resume_id)
        try:
            db.rollback()
            if report is not None:
                report.status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

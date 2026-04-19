"""GPT-powered deep candidate × job comparison report."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.openai_client import get_openai_client
from app.models.ai_report import AIAnalysisReport
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.services.gpt_matching_service import GPT_MATCH_MODEL

logger = logging.getLogger(__name__)

REPORT_TYPE = "deep_match"

_SYSTEM_PROMPT = """\
Act as a Senior Talent Acquisition Specialist.

You will receive a candidate's resume and a job description.
Produce a comprehensive, honest match report comparing this specific candidate to this specific job.

Return ONLY a valid JSON object with the exact structure below — no markdown, no extra text.

{
  "overall_score": <number 0-100>,
  "decision": "Strong Match" or "Good Match" or "Partial Match" or "Poor Match",
  "executive_summary": "3-4 sentences: candidate overview + how well they fit this specific role",
  "sections": {
    "role_alignment": {
      "score": <number 0-10>,
      "analysis": "does the candidate's domain and job title history align with this role?"
    },
    "location_match": {
      "score": <number 0-10>,
      "candidate_location": "<city/country from resume or null>",
      "job_location": "<city/country from job or null>",
      "is_match": <true or false>,
      "analysis": "location comparison, remote/hybrid consideration if mentioned"
    },
    "experience_match": {
      "score": <number 0-10>,
      "candidate_years": <estimated years as number or null>,
      "analysis": "years and relevance of experience vs what the job requires"
    },
    "skills_match": {
      "score": <number 0-10>,
      "matched": ["skill1", "skill2"],
      "missing": ["skill1", "skill2"],
      "analysis": "key technical and soft skills comparison"
    },
    "education_match": {
      "score": <number 0-10>,
      "analysis": "education level and field relevance to this job"
    }
  },
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "gaps": ["specific gap 1", "specific gap 2", "specific gap 3"],
  "recommendation": {
    "decision": "Strong Match" or "Good Match" or "Partial Match" or "Poor Match",
    "action": "Shortlist" or "Consider" or "Hold" or "Reject",
    "reason": "one concise reason for this decision"
  }
}

Score Logic (apply to overall_score strictly):
- 80-100 → "Strong Match"
- 60-79  → "Good Match"
- 40-59  → "Partial Match"
- 0-39   → "Poor Match"

Rules:
- Be specific to THIS candidate and THIS job — no generic statements
- For location: if job says remote/hybrid, score generously on location
- Do NOT fabricate data not present in the resume or job description
- Return ONLY valid JSON\
"""


def run_deep_match_report_task(report_id: str) -> None:
    """Background task: generate a deep match report for an existing AIAnalysisReport record."""
    from app.db.session import SessionLocal

    db: Session = SessionLocal()

    try:
        report = db.get(AIAnalysisReport, report_id)
        if not report or report.status != "pending":
            return

        resume = db.get(Resume, report.resume_id)
        job = db.get(JobDescription, report.job_description_id) if report.job_description_id else None

        if not resume or not job:
            report.status = "failed"
            db.commit()
            return

        resume_text = (resume.normalized_text or resume.raw_text or "").strip()
        job_text = (job.normalized_text or job.source_text or "").strip()

        if not resume_text or not job_text:
            report.status = "failed"
            db.commit()
            return

        job_context = f"Job Title: {job.title}"
        if job.company_name:
            job_context += f"\nCompany: {job.company_name}"
        if job.location_text:
            job_context += f"\nLocation: {job.location_text}"
        if job.employment_type:
            job_context += f"\nEmployment Type: {job.employment_type.value if hasattr(job.employment_type, 'value') else job.employment_type}"
        job_context += f"\n\nJob Description:\n{job_text}"

        client = get_openai_client()
        response = client.chat.completions.create(
            model=GPT_MATCH_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Resume:\n\n{resume_text}\n\n---\n\n{job_context}",
                },
            ],
            temperature=0.2,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )

        raw = (response.choices[0].message.content or "").strip()
        parsed = json.loads(raw)

        report.report_text = json.dumps(parsed, ensure_ascii=False)
        report.status = "completed"
        report.completed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception:
        logger.exception("Deep match report failed for report %s", report_id)
        try:
            db.rollback()
            report = db.get(AIAnalysisReport, report_id)
            if report is not None:
                report.status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


def get_existing_report(
    db: Session, resume_id: str, job_description_id: str, user_id: str
) -> AIAnalysisReport | None:
    return db.scalar(
        select(AIAnalysisReport)
        .where(
            AIAnalysisReport.resume_id == resume_id,
            AIAnalysisReport.job_description_id == job_description_id,
            AIAnalysisReport.user_id == user_id,
            AIAnalysisReport.report_type == REPORT_TYPE,
        )
        .order_by(AIAnalysisReport.created_at.desc())
        .limit(1)
    )

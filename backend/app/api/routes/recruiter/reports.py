"""Deep Match Reports — generate and retrieve GPT candidate × job reports."""

from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_recruiter
from app.api.deps.db import get_db
from app.models.ai_report import AIAnalysisReport
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.models.user import User
from app.services.deep_match_report_service import (
    REPORT_TYPE,
    get_existing_report,
    run_deep_match_report_task,
)
from app.services.gpt_matching_service import GPT_MATCH_MODEL

router = APIRouter(prefix="/recruiter/reports", tags=["recruiter-reports"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class ReportListItem(BaseModel):
    id: str
    resume_id: str
    candidate_name: str
    job_id: str | None
    job_title: str | None
    overall_score: float | None
    decision: str | None
    status: str
    created_at: datetime
    completed_at: datetime | None


class CreateReportRequest(BaseModel):
    resume_id: str
    job_id: str


class ReportSectionLocationMatch(BaseModel):
    score: float
    candidate_location: str | None
    job_location: str | None
    is_match: bool
    analysis: str


class ReportSection(BaseModel):
    score: float
    analysis: str


class ReportSkillsSection(BaseModel):
    score: float
    matched: list[str]
    missing: list[str]
    analysis: str


class ReportExperienceSection(BaseModel):
    score: float
    candidate_years: float | None
    analysis: str


class ReportSections(BaseModel):
    role_alignment: ReportSection | None = None
    location_match: ReportSectionLocationMatch | None = None
    experience_match: ReportExperienceSection | None = None
    skills_match: ReportSkillsSection | None = None
    education_match: ReportSection | None = None


class ReportRecommendation(BaseModel):
    decision: str
    action: str
    reason: str


class ReportDetail(BaseModel):
    overall_score: float
    decision: str
    executive_summary: str
    sections: ReportSections
    strengths: list[str]
    gaps: list[str]
    recommendation: ReportRecommendation


class FullReportResponse(BaseModel):
    id: str
    resume_id: str
    candidate_name: str
    job_id: str | None
    job_title: str | None
    job_location: str | None
    status: str
    created_at: datetime
    completed_at: datetime | None
    report: ReportDetail | None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _candidate_name(resume: Resume) -> str:
    if isinstance(resume.structured_data, dict):
        name = resume.structured_data.get("name")
        if name:
            return str(name)
    return resume.title


def _parse_report(report_text: str | None) -> ReportDetail | None:
    if not report_text:
        return None
    try:
        import json
        data = json.loads(report_text)
        secs = data.get("sections", {})

        def _section(key: str) -> ReportSection | None:
            s = secs.get(key)
            if not s:
                return None
            return ReportSection(score=float(s.get("score", 0)), analysis=s.get("analysis", ""))

        loc = secs.get("location_match")
        loc_section = (
            ReportSectionLocationMatch(
                score=float(loc.get("score", 0)),
                candidate_location=loc.get("candidate_location"),
                job_location=loc.get("job_location"),
                is_match=bool(loc.get("is_match", False)),
                analysis=loc.get("analysis", ""),
            )
            if loc
            else None
        )

        exp = secs.get("experience_match")
        exp_section = (
            ReportExperienceSection(
                score=float(exp.get("score", 0)),
                candidate_years=exp.get("candidate_years"),
                analysis=exp.get("analysis", ""),
            )
            if exp
            else None
        )

        skills = secs.get("skills_match")
        skills_section = (
            ReportSkillsSection(
                score=float(skills.get("score", 0)),
                matched=skills.get("matched", []),
                missing=skills.get("missing", []),
                analysis=skills.get("analysis", ""),
            )
            if skills
            else None
        )

        rec = data.get("recommendation", {})
        return ReportDetail(
            overall_score=float(data.get("overall_score", 0)),
            decision=data.get("decision", ""),
            executive_summary=data.get("executive_summary", ""),
            sections=ReportSections(
                role_alignment=_section("role_alignment"),
                location_match=loc_section,
                experience_match=exp_section,
                skills_match=skills_section,
                education_match=_section("education_match"),
            ),
            strengths=data.get("strengths", []),
            gaps=data.get("gaps", []),
            recommendation=ReportRecommendation(
                decision=rec.get("decision", ""),
                action=rec.get("action", ""),
                reason=rec.get("reason", ""),
            ),
        )
    except Exception:
        return None


def _score_from_report(report_text: str | None) -> float | None:
    if not report_text:
        return None
    try:
        import json
        return float(json.loads(report_text).get("overall_score", 0))
    except Exception:
        return None


def _decision_from_report(report_text: str | None) -> str | None:
    if not report_text:
        return None
    try:
        import json
        return json.loads(report_text).get("decision")
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[ReportListItem])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> list[ReportListItem]:
    """List all deep match reports for this recruiter."""
    reports = db.scalars(
        select(AIAnalysisReport)
        .where(
            AIAnalysisReport.user_id == current_user.id,
            AIAnalysisReport.report_type == REPORT_TYPE,
        )
        .order_by(AIAnalysisReport.created_at.desc())
    )

    items: list[ReportListItem] = []
    for r in reports:
        resume = db.get(Resume, r.resume_id)
        job = db.get(JobDescription, r.job_description_id) if r.job_description_id else None
        items.append(
            ReportListItem(
                id=r.id,
                resume_id=r.resume_id,
                candidate_name=_candidate_name(resume) if resume else r.resume_title or "Unknown",
                job_id=r.job_description_id,
                job_title=job.title if job else None,
                overall_score=_score_from_report(r.report_text),
                decision=_decision_from_report(r.report_text),
                status=r.status,
                created_at=r.created_at,
                completed_at=r.completed_at,
            )
        )
    return items


@router.post("/", response_model=ReportListItem, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: CreateReportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> ReportListItem:
    """Request a deep match report for a candidate × job pair."""
    resume = db.get(Resume, payload.resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    job = db.get(JobDescription, payload.job_id)
    if not job or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Job not found.")

    existing = get_existing_report(db, payload.resume_id, payload.job_id, current_user.id)
    if existing and existing.status in ("pending", "completed"):
        return ReportListItem(
            id=existing.id,
            resume_id=existing.resume_id,
            candidate_name=_candidate_name(resume),
            job_id=existing.job_description_id,
            job_title=job.title,
            overall_score=_score_from_report(existing.report_text),
            decision=_decision_from_report(existing.report_text),
            status=existing.status,
            created_at=existing.created_at,
            completed_at=existing.completed_at,
        )

    if existing:
        db.delete(existing)
        db.commit()

    report = AIAnalysisReport(
        user_id=current_user.id,
        resume_id=payload.resume_id,
        resume_title=resume.source_filename or resume.title,
        job_description_id=payload.job_id,
        job_description_text=job.source_text,
        model_name=GPT_MATCH_MODEL,
        report_type=REPORT_TYPE,
        status="pending",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    background_tasks.add_task(run_deep_match_report_task, report.id)

    return ReportListItem(
        id=report.id,
        resume_id=report.resume_id,
        candidate_name=_candidate_name(resume),
        job_id=report.job_description_id,
        job_title=job.title,
        overall_score=None,
        decision=None,
        status=report.status,
        created_at=report.created_at,
        completed_at=None,
    )


@router.get("/{report_id}", response_model=FullReportResponse)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> FullReportResponse:
    """Get a single deep match report by ID."""
    report = db.get(AIAnalysisReport, report_id)
    if not report or report.user_id != current_user.id or report.report_type != REPORT_TYPE:
        raise HTTPException(status_code=404, detail="Report not found.")

    resume = db.get(Resume, report.resume_id)
    job = db.get(JobDescription, report.job_description_id) if report.job_description_id else None

    return FullReportResponse(
        id=report.id,
        resume_id=report.resume_id,
        candidate_name=_candidate_name(resume) if resume else report.resume_title or "Unknown",
        job_id=report.job_description_id,
        job_title=job.title if job else None,
        job_location=job.location_text if job else None,
        status=report.status,
        created_at=report.created_at,
        completed_at=report.completed_at,
        report=_parse_report(report.report_text),
    )


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> None:
    """Delete a deep match report."""
    report = db.get(AIAnalysisReport, report_id)
    if not report or report.user_id != current_user.id or report.report_type != REPORT_TYPE:
        raise HTTPException(status_code=404, detail="Report not found.")
    db.delete(report)
    db.commit()

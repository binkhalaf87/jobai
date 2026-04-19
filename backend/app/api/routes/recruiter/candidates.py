import json
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_recruiter
from app.api.deps.db import get_db
from app.core.rate_limit import limiter
from app.models.analysis import Analysis
from app.models.enums import AnalysisStatus, CandidateStage, ResumeProcessingStatus
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.models.user import User
from app.services.gpt_matching_service import (
    GPT_MATCH_MODEL_NAME,
    gpt_match_resume_to_job,
    gpt_screen_resume_against_jobs,
)
from app.models.ai_report import AIAnalysisReport
from app.services.resume_upload import save_resume_upload
from app.services.screening_report_service import REPORT_TYPE, run_screening_report_task
from app.services.storage import get_storage

router = APIRouter(prefix="/recruiter/candidates", tags=["recruiter-candidates"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class CandidateUploadResponse(BaseModel):
    resume_ids: list[str]


class CandidateListItem(BaseModel):
    id: str
    title: str
    parsed_name: str | None
    email: str | None
    created_at: datetime
    stage: CandidateStage
    status: ResumeProcessingStatus
    best_match_job: str | None
    best_match_score: float | None
    best_match_keywords: list[str]
    best_missing_keywords: list[str]
    analysis_completed_at: datetime | None


class JobMatchDetail(BaseModel):
    job_id: str
    job_title: str
    overall_score: float
    matching_keywords: list[str]
    missing_keywords: list[str]
    raw_payload: dict | None = None


class TopRecommendation(BaseModel):
    job_title: str
    reason: str


class CandidateDetail(BaseModel):
    id: str
    title: str
    parsed_name: str | None
    email: str | None
    created_at: datetime
    stage: CandidateStage
    status: ResumeProcessingStatus
    skills: list[str]
    experience_summary: list[str]
    file_type: str | None
    file_available: bool
    source_filename: str | None
    raw_text: str | None
    matches: list[JobMatchDetail]
    top_recommendation: TopRecommendation | None
    analysis_completed_at: datetime | None


class StageUpdatePayload(BaseModel):
    stage: CandidateStage


class StageUpdateResponse(BaseModel):
    id: str
    stage: CandidateStage


class AnalyzeResponse(BaseModel):
    analyses_created: int
    analyses_skipped: int
    has_resume_text: bool
    warning: str | None = None


class AnalyzeRequest(BaseModel):
    force_refresh: bool = False


class AnalyzeAllResponse(BaseModel):
    total_candidates: int
    total_created: int
    total_skipped: int
    no_text_count: int


class BulkIdsPayload(BaseModel):
    ids: list[str]


class BulkDeleteResponse(BaseModel):
    deleted: int


class BulkAnalyzeResponse(BaseModel):
    analyses_created: int
    analyses_skipped: int
    no_text_count: int


class ScreeningReportResponse(BaseModel):
    id: str
    status: str
    created_at: datetime
    completed_at: datetime | None
    report: dict | None


class ScreenAllResponse(BaseModel):
    queued: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_owned_resume(db: Session, resume_id: str, recruiter_id: str) -> Resume:
    resume = db.get(Resume, resume_id)
    if not resume or resume.user_id != recruiter_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
    return resume


def _get_recruiter_jobs(db: Session, recruiter_id: str) -> list[JobDescription]:
    return list(db.scalars(select(JobDescription).where(JobDescription.user_id == recruiter_id)))


def _get_resume_analysis_input(resume: Resume) -> tuple[str, str | None]:
    """Return (resume_text, pdf_local_path_or_None) for GPT analysis.

    pdf_local_path is only available when using local storage.
    With cloud storage the PDF vision feature falls back to text-only analysis.
    """
    resume_text = resume.normalized_text or resume.raw_text or ""
    pdf_path: str | None = None

    if (resume.file_type or "").lower() == "pdf" and resume.storage_key:
        local_path = get_storage().get_local_path(resume.storage_key)
        if local_path:
            pdf_path = str(local_path)

    return resume_text, pdf_path


def _has_resume_analysis_input(resume: Resume) -> bool:
    resume_text, pdf_path = _get_resume_analysis_input(resume)
    return bool(resume_text.strip() or pdf_path)


def _get_existing_completed_analysis(db: Session, resume_id: str, job_id: str) -> Analysis | None:
    return db.scalar(
        select(Analysis)
        .where(
            Analysis.resume_id == resume_id,
            Analysis.job_description_id == job_id,
            Analysis.status == AnalysisStatus.COMPLETED,
            Analysis.overall_score.is_not(None),
        )
        .order_by(Analysis.completed_at.desc(), Analysis.created_at.desc())
        .limit(1)
    )


def _run_gpt_screening_batch(
    db: Session,
    recruiter_id: str,
    resume: Resume,
    jobs: list[JobDescription],
    force_refresh: bool = False,
) -> tuple[int, int]:
    """Screen one resume against all jobs in a single GPT call.

    Saves/updates one Analysis record per job.
    Returns (created_count, skipped_count).
    """
    resume_text, pdf_path = _get_resume_analysis_input(resume)

    # Filter to jobs that have text, and skip already-analyzed ones when not forcing
    eligible_jobs: list[JobDescription] = []
    skipped = 0
    for job in jobs:
        job_text = job.normalized_text or job.source_text or ""
        if not job_text:
            skipped += 1
            continue
        if not force_refresh and _get_existing_completed_analysis(db, resume.id, job.id):
            skipped += 1
            continue
        eligible_jobs.append(job)

    if not eligible_jobs:
        return 0, skipped

    jobs_payload = [
        {
            "job_id": job.id,
            "job_title": job.title,
            "job_text": (job.normalized_text or job.source_text or "").strip(),
        }
        for job in eligible_jobs
    ]

    try:
        result = gpt_screen_resume_against_jobs(
            jobs_payload,
            pdf_path=pdf_path,
            resume_text=resume_text,
        )
    except Exception:
        return 0, skipped + len(eligible_jobs)

    # Update resume structured_data with GPT-extracted candidate info
    if result.parsed_name or result.skills or result.experience_summary:
        existing = resume.structured_data if isinstance(resume.structured_data, dict) else {}
        resume.structured_data = {
            **existing,
            **({"name": result.parsed_name} if result.parsed_name else {}),
            **({"email": result.email} if result.email else {}),
            **({"skills": result.skills} if result.skills else {}),
            **({"experience": result.experience_summary} if result.experience_summary else {}),
        }

    now = datetime.now(timezone.utc)
    created = 0

    # Build a lookup from job_id → match result
    match_by_job_id = {m.job_id: m for m in result.matches}

    for job in eligible_jobs:
        match = match_by_job_id.get(job.id)
        if not match:
            skipped += 1
            continue

        existing_analysis = _get_existing_completed_analysis(db, resume.id, job.id)
        analysis = existing_analysis or Analysis(
            user_id=recruiter_id,
            resume_id=resume.id,
            job_description_id=job.id,
        )
        analysis.status = AnalysisStatus.COMPLETED
        analysis.model_name = GPT_MATCH_MODEL_NAME
        analysis.overall_score = match.overall_score
        analysis.summary_text = match.recommendation
        analysis.result_payload = match.to_payload()
        analysis.completed_at = now

        if existing_analysis is None:
            db.add(analysis)
            created += 1

    db.commit()
    return created, skipped


def _run_gpt_analysis(
    db: Session,
    recruiter_id: str,
    resume: Resume,
    job: JobDescription,
    force_refresh: bool = False,
) -> tuple[Analysis | None, bool]:
    """Single-job GPT analysis (kept for direct per-job calls). Delegates to batch internally."""
    created, _ = _run_gpt_screening_batch(
        db, recruiter_id, resume, [job], force_refresh=force_refresh
    )
    analysis = _get_existing_completed_analysis(db, resume.id, job.id)
    return analysis, created > 0


def _keywords_from_payload(payload: dict | None, key: str) -> list[str]:
    if not payload:
        return []
    value = payload.get(key, [])
    return [str(k) for k in value if k] if isinstance(value, list) else []


def _email_from_structured(structured: dict | None) -> str | None:
    if not isinstance(structured, dict):
        return None
    contact = structured.get("contact")
    if isinstance(contact, dict):
        return contact.get("email")
    return structured.get("email")


def _build_list_item(db: Session, resume: Resume) -> CandidateListItem:
    structured = resume.structured_data if isinstance(resume.structured_data, dict) else {}

    best_analysis = db.scalar(
        select(Analysis)
        .where(
            Analysis.resume_id == resume.id,
            Analysis.status == AnalysisStatus.COMPLETED,
            Analysis.overall_score.is_not(None),
        )
        .order_by(Analysis.overall_score.desc())
        .limit(1)
    )

    best_job_title: str | None = None
    best_score: float | None = None
    best_match_keywords: list[str] = []
    best_missing_keywords: list[str] = []
    analysis_completed_at: datetime | None = None

    if best_analysis:
        job = db.get(JobDescription, best_analysis.job_description_id)
        best_job_title = job.title if job else None
        best_score = float(best_analysis.overall_score)
        payload = best_analysis.result_payload or {}
        best_match_keywords = _keywords_from_payload(payload, "matching_keywords")[:5]
        best_missing_keywords = _keywords_from_payload(payload, "missing_keywords")[:5]
        analysis_completed_at = best_analysis.completed_at

    return CandidateListItem(
        id=resume.id,
        title=resume.title,
        parsed_name=structured.get("name"),
        email=_email_from_structured(resume.structured_data),
        created_at=resume.created_at,
        stage=resume.recruiter_stage,
        status=resume.processing_status,
        best_match_job=best_job_title,
        best_match_score=best_score,
        best_match_keywords=best_match_keywords,
        best_missing_keywords=best_missing_keywords,
        analysis_completed_at=analysis_completed_at,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/upload", response_model=CandidateUploadResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/hour")
async def upload_candidates(
    request: Request,
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> CandidateUploadResponse:
    """Upload resumes. Text is extracted immediately; screening report runs in background."""
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided.")

    resume_ids: list[str] = []
    stored_keys: list[str] = []

    try:
        for uploaded_file in files:
            resume = await save_resume_upload(db, current_user, uploaded_file, auto_commit=False)
            resume_ids.append(resume.id)
            if resume.storage_key:
                stored_keys.append(resume.storage_key)
        db.commit()
    except ValueError as exc:
        db.rollback()
        storage = get_storage()
        for storage_key in stored_keys:
            storage.delete(storage_key)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception:
        db.rollback()
        storage = get_storage()
        for storage_key in stored_keys:
            storage.delete(storage_key)
        raise

    # Queue screening report for each uploaded resume
    for rid in resume_ids:
        background_tasks.add_task(run_screening_report_task, rid, current_user.id)

    return CandidateUploadResponse(resume_ids=resume_ids)


@router.get("/", response_model=list[CandidateListItem])
def list_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> list[CandidateListItem]:
    resumes = list(
        db.scalars(
            select(Resume)
            .where(Resume.user_id == current_user.id)
            .order_by(Resume.created_at.desc())
        )
    )
    return [_build_list_item(db, resume) for resume in resumes]


@router.post("/analyze-all", response_model=AnalyzeAllResponse)
def analyze_all_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> AnalyzeAllResponse:
    """Run GPT analysis for every candidate against every job."""
    resumes = list(
        db.scalars(select(Resume).where(Resume.user_id == current_user.id))
    )
    jobs = _get_recruiter_jobs(db, current_user.id)

    if not jobs:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No jobs found. Add at least one job before running analysis.",
        )

    total_created = 0
    total_skipped = 0
    no_text_count = 0

    for resume in resumes:
        if not _has_resume_analysis_input(resume):
            no_text_count += 1
            continue

        created, skipped = _run_gpt_screening_batch(db, current_user.id, resume, jobs)
        total_created += created
        total_skipped += skipped

    return AnalyzeAllResponse(
        total_candidates=len(resumes),
        total_created=total_created,
        total_skipped=total_skipped,
        no_text_count=no_text_count,
    )


@router.get("/{resume_id}", response_model=CandidateDetail)
def get_candidate(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> CandidateDetail:
    resume = _get_owned_resume(db, resume_id, current_user.id)

    structured = resume.structured_data or {}
    skills: list[str] = structured.get("skills", []) if isinstance(structured, dict) else []
    experience_summary: list[str] = structured.get("experience", []) if isinstance(structured, dict) else []

    analyses = list(
        db.scalars(
            select(Analysis)
            .where(
                Analysis.resume_id == resume_id,
                Analysis.status == AnalysisStatus.COMPLETED,
                Analysis.overall_score.is_not(None),
            )
            .order_by(Analysis.overall_score.desc())
        )
    )

    matches: list[JobMatchDetail] = []
    for analysis in analyses:
        job = db.get(JobDescription, analysis.job_description_id)
        if not job:
            continue
        payload = analysis.result_payload or {}
        matches.append(
            JobMatchDetail(
                job_id=job.id,
                job_title=job.title,
                overall_score=float(analysis.overall_score),
                matching_keywords=_keywords_from_payload(payload, "matching_keywords"),
                missing_keywords=_keywords_from_payload(payload, "missing_keywords"),
                raw_payload=payload if payload else None,
            )
        )

    top_recommendation: TopRecommendation | None = None
    analysis_completed_at: datetime | None = None

    if matches and analyses:
        best = analyses[0]
        analysis_completed_at = best.completed_at
        best_job = db.get(JobDescription, best.job_description_id)
        if best_job:
            reason = best.summary_text or (
                f"{resume.title} matches {best_job.title} with a score of "
                f"{float(best.overall_score):.1f}%."
            )
            top_recommendation = TopRecommendation(
                job_title=best_job.title,
                reason=reason,
            )

    file_available = bool(resume.storage_key and get_storage().exists(resume.storage_key))

    return CandidateDetail(
        id=resume.id,
        title=resume.title,
        parsed_name=structured.get("name") if isinstance(structured, dict) else None,
        email=_email_from_structured(resume.structured_data),
        created_at=resume.created_at,
        stage=resume.recruiter_stage,
        status=resume.processing_status,
        skills=skills,
        experience_summary=experience_summary,
        file_type=resume.file_type,
        file_available=file_available,
        source_filename=resume.source_filename,
        raw_text=resume.raw_text,
        matches=matches,
        top_recommendation=top_recommendation,
        analysis_completed_at=analysis_completed_at,
    )


@router.patch("/{resume_id}/stage", response_model=StageUpdateResponse)
def update_stage(
    resume_id: str,
    payload: StageUpdatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> StageUpdateResponse:
    resume = _get_owned_resume(db, resume_id, current_user.id)
    resume.recruiter_stage = payload.stage
    db.commit()
    db.refresh(resume)
    return StageUpdateResponse(id=resume.id, stage=resume.recruiter_stage)


@router.post("/{resume_id}/analyze", response_model=AnalyzeResponse)
def analyze_candidate(
    resume_id: str,
    payload: AnalyzeRequest | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> AnalyzeResponse:
    """Run GPT analysis for this candidate against all recruiter jobs."""
    resume = _get_owned_resume(db, resume_id, current_user.id)

    has_resume_text = _has_resume_analysis_input(resume)

    if not has_resume_text:
        return AnalyzeResponse(
            analyses_created=0,
            analyses_skipped=0,
            has_resume_text=False,
            warning=(
                "This resume does not have usable text or a stored PDF file for AI analysis. "
                "Try uploading a searchable PDF or DOCX file."
            ),
        )

    jobs = _get_recruiter_jobs(db, current_user.id)

    if not jobs:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No jobs found. Add at least one job before running analysis.",
        )

    force_refresh = payload.force_refresh if payload else False
    created, skipped = _run_gpt_screening_batch(
        db, current_user.id, resume, jobs, force_refresh=force_refresh
    )

    return AnalyzeResponse(
        analyses_created=created,
        analyses_skipped=skipped,
        has_resume_text=has_resume_text,
    )


_MIME_TYPES: dict[str, str] = {
    "pdf":  "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc":  "application/msword",
}


@router.get("/{resume_id}/screening", response_model=ScreeningReportResponse | None)
def get_screening_report(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> ScreeningReportResponse | None:
    """Return the latest screening report for a candidate (or null if none)."""
    _get_owned_resume(db, resume_id, current_user.id)
    report = db.scalar(
        select(AIAnalysisReport)
        .where(
            AIAnalysisReport.resume_id == resume_id,
            AIAnalysisReport.report_type == REPORT_TYPE,
        )
        .order_by(AIAnalysisReport.created_at.desc())
        .limit(1)
    )
    if not report:
        return None
    parsed: dict | None = None
    if report.report_text:
        try:
            parsed = json.loads(report.report_text)
        except Exception:
            pass
    return ScreeningReportResponse(
        id=report.id,
        status=report.status,
        created_at=report.created_at,
        completed_at=report.completed_at,
        report=parsed,
    )


@router.post("/{resume_id}/screening", response_model=ScreeningReportResponse, status_code=status.HTTP_202_ACCEPTED)
def trigger_screening_report(
    resume_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> ScreeningReportResponse:
    """(Re-)generate a screening report for a candidate."""
    resume = _get_owned_resume(db, resume_id, current_user.id)

    # Delete any existing report so a fresh one is created
    existing = db.scalar(
        select(AIAnalysisReport)
        .where(
            AIAnalysisReport.resume_id == resume_id,
            AIAnalysisReport.report_type == REPORT_TYPE,
        )
        .limit(1)
    )
    if existing:
        db.delete(existing)
        db.commit()

    placeholder = AIAnalysisReport(
        user_id=current_user.id,
        resume_id=resume_id,
        resume_title=resume.source_filename or resume.title,
        model_name="queued",
        report_type=REPORT_TYPE,
        status="pending",
    )
    db.add(placeholder)
    db.commit()
    db.refresh(placeholder)

    background_tasks.add_task(run_screening_report_task, resume_id, current_user.id)

    return ScreeningReportResponse(
        id=placeholder.id,
        status="pending",
        created_at=placeholder.created_at,
        completed_at=None,
        report=None,
    )


@router.get("/{resume_id}/file", response_model=None)
def get_resume_file(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    """Serve or redirect to the original uploaded resume file.

    - Local backend  → FileResponse (direct streaming).
    - Cloud backend  → 307 redirect to a pre-signed URL (1-hour TTL).
    """
    resume = _get_owned_resume(db, resume_id, current_user.id)

    if not resume.storage_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No file stored for this resume.")

    storage = get_storage()

    # Cloud path — pre-signed URL redirect
    url = storage.get_download_url(resume.storage_key, expires_in=3600)
    if url:
        return RedirectResponse(url=url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    # Local path — direct streaming
    local_path = storage.get_local_path(resume.storage_key)
    if not local_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found.")

    file_type = (resume.file_type or "").lower()
    media_type = _MIME_TYPES.get(file_type, "application/octet-stream")
    disposition = "inline" if file_type == "pdf" else "attachment"
    filename = resume.source_filename or f"resume.{file_type}"

    return FileResponse(
        path=str(local_path),
        media_type=media_type,
        headers={"Content-Disposition": f'{disposition}; filename="{filename}"'},
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> None:
    resume = _get_owned_resume(db, resume_id, current_user.id)
    storage_key = resume.storage_key
    db.delete(resume)
    db.commit()
    if storage_key:
        get_storage().delete(storage_key)


@router.post("/bulk-delete", response_model=BulkDeleteResponse)
def bulk_delete_candidates(
    payload: BulkIdsPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> BulkDeleteResponse:
    """Delete multiple candidates at once."""
    deleted = 0
    storage = get_storage()
    for resume_id in payload.ids:
        resume = db.get(Resume, resume_id)
        if not resume or resume.user_id != current_user.id:
            continue
        storage_key = resume.storage_key
        db.delete(resume)
        deleted += 1
        if storage_key:
            try:
                storage.delete(storage_key)
            except Exception:
                pass
    db.commit()
    return BulkDeleteResponse(deleted=deleted)


@router.post("/screen-all", response_model=ScreenAllResponse)
def screen_all_candidates(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> ScreenAllResponse:
    """Queue screening reports for all candidates that don't have one yet."""
    resumes = list(db.scalars(select(Resume).where(Resume.user_id == current_user.id)))
    queued = 0
    for resume in resumes:
        if resume.raw_text or resume.normalized_text:
            background_tasks.add_task(run_screening_report_task, resume.id, current_user.id, False)
            queued += 1
    return ScreenAllResponse(queued=queued)


@router.post("/bulk-screen", response_model=ScreenAllResponse)
def bulk_screen_candidates(
    payload: BulkIdsPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> ScreenAllResponse:
    """Re-run screening report for a selected set of candidates (force refresh)."""
    queued = 0
    for resume_id in payload.ids:
        resume = db.get(Resume, resume_id)
        if resume and resume.user_id == current_user.id:
            background_tasks.add_task(run_screening_report_task, resume_id, current_user.id, True)
            queued += 1
    return ScreenAllResponse(queued=queued)


@router.post("/bulk-analyze", response_model=BulkAnalyzeResponse)
def bulk_analyze_candidates(
    payload: BulkIdsPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> BulkAnalyzeResponse:
    """Re-run GPT analysis for a selected set of candidates."""
    jobs = _get_recruiter_jobs(db, current_user.id)
    if not jobs:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No jobs found. Add at least one job before running analysis.",
        )

    total_created = 0
    total_skipped = 0
    no_text_count = 0

    for resume_id in payload.ids:
        resume = db.get(Resume, resume_id)
        if not resume or resume.user_id != current_user.id:
            continue
        if not _has_resume_analysis_input(resume):
            no_text_count += 1
            continue
        created, skipped = _run_gpt_screening_batch(
            db, current_user.id, resume, jobs, force_refresh=True
        )
        total_created += created
        total_skipped += skipped

    return BulkAnalyzeResponse(
        analyses_created=total_created,
        analyses_skipped=total_skipped,
        no_text_count=no_text_count,
    )

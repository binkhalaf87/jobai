from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_recruiter
from app.api.deps.db import get_db
from app.models.analysis import Analysis
from app.models.enums import AnalysisStatus, CandidateStage, ResumeProcessingStatus
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.models.user import User
from app.services.gpt_matching_service import GPT_MATCH_MODEL_NAME, gpt_match_resume_to_job
from app.services.resume_storage import delete_resume_file, resolve_storage_key, resume_file_exists
from app.services.resume_upload import save_resume_upload

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
    resume_text = resume.normalized_text or resume.raw_text or ""
    resolved_resume_path = resolve_storage_key(resume.storage_key)
    pdf_path: str | None = None

    if (
        (resume.file_type or "").lower() == "pdf"
        and resolved_resume_path
        and resolved_resume_path.exists()
        and resolved_resume_path.is_file()
    ):
        pdf_path = str(resolved_resume_path)

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


def _run_gpt_analysis(
    db: Session,
    recruiter_id: str,
    resume: Resume,
    job: JobDescription,
    force_refresh: bool = False,
) -> tuple[Analysis | None, bool]:
    """Run GPT semantic matching and persist. Returns None if text missing or GPT fails.

    Uses vision (PDF pages as images) when the original file is still on disk.
    Falls back to extracted text for DOCX or missing files.
    """
    existing_analysis = _get_existing_completed_analysis(db, resume.id, job.id)
    if existing_analysis and not force_refresh:
        return existing_analysis, False

    job_text = job.normalized_text or job.source_text or ""
    if not job_text:
        return None, False

    resume_text, pdf_path = _get_resume_analysis_input(resume)

    # Need either a file or text
    if not pdf_path and not resume_text:
        return None, False

    try:
        result = gpt_match_resume_to_job(
            job_text,
            pdf_path=pdf_path,
            resume_text=resume_text,
        )
    except Exception:
        return None, False

    summary = result.recommendation or (
        f"GPT match: {result.match_score:.1f}% — {result.hiring_suggestion}."
    )

    analysis = existing_analysis or Analysis(
        user_id=recruiter_id,
        resume_id=resume.id,
        job_description_id=job.id,
    )
    analysis.status = AnalysisStatus.COMPLETED
    analysis.model_name = GPT_MATCH_MODEL_NAME
    analysis.overall_score = result.match_score
    analysis.summary_text = summary
    analysis.result_payload = result.to_payload()
    analysis.completed_at = datetime.now(timezone.utc)

    if existing_analysis is None:
        db.add(analysis)

    db.commit()
    db.refresh(analysis)
    return analysis, existing_analysis is None


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
async def upload_candidates(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> CandidateUploadResponse:
    """Upload resumes. Text is extracted immediately; AI analysis runs separately."""
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
        for storage_key in stored_keys:
            delete_resume_file(storage_key)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception:
        db.rollback()
        for storage_key in stored_keys:
            delete_resume_file(storage_key)
        raise

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

        for job in jobs:
            result, created = _run_gpt_analysis(db, current_user.id, resume, job)
            if result and created:
                total_created += 1
            else:
                total_skipped += 1

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

    file_available = resume_file_exists(resume.storage_key)

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

    created = 0
    skipped = 0
    force_refresh = payload.force_refresh if payload else False
    for job in jobs:
        result, was_created = _run_gpt_analysis(
            db,
            current_user.id,
            resume,
            job,
            force_refresh=force_refresh,
        )
        if result and was_created:
            created += 1
        else:
            skipped += 1

    return AnalyzeResponse(
        analyses_created=created,
        analyses_skipped=skipped,
        has_resume_text=has_resume_text,
    )


@router.get("/{resume_id}/file")
def get_resume_file(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> FileResponse:
    """Serve the original uploaded resume file for inline preview or download."""
    resume = _get_owned_resume(db, resume_id, current_user.id)

    if not resume.storage_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No file stored for this resume.")

    path = resolve_storage_key(resume.storage_key)
    if path is None or not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found on disk.")

    file_type = (resume.file_type or "").lower()
    if file_type == "pdf":
        media_type = "application/pdf"
        disposition = "inline"
    else:
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disposition = "attachment"

    filename = resume.source_filename or f"resume.{file_type}"
    return FileResponse(
        path=str(path),
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
    delete_resume_file(storage_key)

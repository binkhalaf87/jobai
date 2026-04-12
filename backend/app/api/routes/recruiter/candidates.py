from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
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
from app.services.analysis_matching import MATCH_MODEL_NAME, compute_match_result
from app.services.gpt_matching_service import GPT_MATCH_MODEL_NAME, gpt_match_resume_to_job
from app.services.resume_upload import save_resume_upload

router = APIRouter(prefix="/recruiter/candidates", tags=["recruiter-candidates"])


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------


class CandidateUploadResponse(BaseModel):
    resume_ids: list[str]


class CandidateListItem(BaseModel):
    id: str
    title: str
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
    email: str | None
    created_at: datetime
    stage: CandidateStage
    status: ResumeProcessingStatus
    skills: list[str]
    raw_text: str | None
    matches: list[JobMatchDetail]
    top_recommendation: TopRecommendation | None
    analysis_completed_at: datetime | None


class StageUpdatePayload(BaseModel):
    stage: CandidateStage


class StageUpdateResponse(BaseModel):
    id: str
    stage: CandidateStage


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


def _run_and_save_analysis(
    db: Session,
    recruiter_id: str,
    resume: Resume,
    job: JobDescription,
) -> Analysis | None:
    resume_text = resume.normalized_text or resume.raw_text or ""
    job_text = job.normalized_text or job.source_text or ""

    if not resume_text or not job_text:
        return None

    try:
        result = compute_match_result(resume_text, job_text)
    except Exception:
        return None

    analysis = Analysis(
        user_id=recruiter_id,
        resume_id=resume.id,
        job_description_id=job.id,
        status=AnalysisStatus.COMPLETED,
        model_name=MATCH_MODEL_NAME,
        overall_score=result.match_score,
        summary_text=(
            f"TF-IDF match: {result.match_score:.2f}% similarity, "
            f"{len(result.matching_keywords)} matching keywords."
        ),
        result_payload=result.to_payload(),
        completed_at=datetime.now(timezone.utc),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def _run_gpt_analysis(
    db: Session,
    recruiter_id: str,
    resume: Resume,
    job: JobDescription,
) -> Analysis | None:
    """Run GPT semantic matching and persist the result."""
    resume_text = resume.normalized_text or resume.raw_text or ""
    job_text = job.normalized_text or job.source_text or ""

    if not resume_text or not job_text:
        return None

    try:
        result = gpt_match_resume_to_job(resume_text, job_text)
    except Exception:
        return None

    summary = result.recommendation or (
        f"GPT match: {result.match_score:.1f}% — {result.hiring_suggestion}. "
        f"{len(result.matching_keywords)} matching skills."
    )

    analysis = Analysis(
        user_id=recruiter_id,
        resume_id=resume.id,
        job_description_id=job.id,
        status=AnalysisStatus.COMPLETED,
        model_name=GPT_MATCH_MODEL_NAME,
        overall_score=result.match_score,
        summary_text=summary,
        result_payload=result.to_payload(),
        completed_at=datetime.now(timezone.utc),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def _keywords_from_payload(payload: dict | None, key: str) -> list[str]:
    if not payload:
        return []
    value = payload.get(key, [])
    return [str(k) for k in value if k] if isinstance(value, list) else []


def _email_from_structured(structured: dict | None) -> str | None:
    if not isinstance(structured, dict):
        return None
    return structured.get("email") or structured.get("contact", {}).get("email") if isinstance(structured.get("contact"), dict) else structured.get("email")


def _build_list_item(db: Session, resume: Resume) -> CandidateListItem:
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
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided.")

    jobs = _get_recruiter_jobs(db, current_user.id)
    resume_ids: list[str] = []

    for uploaded_file in files:
        try:
            resume = await save_resume_upload(db, current_user, uploaded_file)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        for job in jobs:
            _run_and_save_analysis(db, current_user.id, resume, job)

        resume_ids.append(resume.id)

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


@router.get("/{resume_id}", response_model=CandidateDetail)
def get_candidate(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> CandidateDetail:
    resume = _get_owned_resume(db, resume_id, current_user.id)

    structured = resume.structured_data or {}
    skills: list[str] = structured.get("skills", []) if isinstance(structured, dict) else []

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

    return CandidateDetail(
        id=resume.id,
        title=resume.title,
        email=_email_from_structured(resume.structured_data),
        created_at=resume.created_at,
        stage=resume.recruiter_stage,
        status=resume.processing_status,
        skills=skills,
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


class AnalyzeResponse(BaseModel):
    analyses_created: int
    analyses_skipped: int
    has_resume_text: bool
    mode: str
    warning: str | None = None


@router.post("/{resume_id}/analyze", response_model=AnalyzeResponse)
def analyze_candidate(
    resume_id: str,
    mode: str = "tfidf",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> AnalyzeResponse:
    """Run (or re-run) matching between this resume and all recruiter jobs."""
    resume = _get_owned_resume(db, resume_id, current_user.id)

    resume_text = resume.normalized_text or resume.raw_text or ""
    has_resume_text = bool(resume_text.strip())

    if not has_resume_text:
        return AnalyzeResponse(
            analyses_created=0,
            analyses_skipped=0,
            has_resume_text=False,
            mode=mode,
            warning=(
                "No text could be extracted from this resume. "
                "The file may be a scanned image (not searchable PDF). "
                "Try uploading a text-based PDF or DOCX file."
            ),
        )

    jobs = _get_recruiter_jobs(db, current_user.id)

    if not jobs:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No jobs found. Add at least one job before running analysis.",
        )

    use_gpt = mode == "gpt"
    created = 0
    skipped = 0

    for job in jobs:
        if use_gpt:
            result = _run_gpt_analysis(db, current_user.id, resume, job)
        else:
            result = _run_and_save_analysis(db, current_user.id, resume, job)

        if result:
            created += 1
        else:
            skipped += 1

    warning: str | None = None
    if created == 0 and skipped > 0 and not use_gpt:
        warning = (
            "Analysis ran but produced no results. "
            "This usually means the resume and job description are in different languages "
            "with no shared technical terms. Try 'Deep AI Analysis' for cross-language matching, "
            "or ensure both texts share common technical keywords."
        )

    return AnalyzeResponse(
        analyses_created=created,
        analyses_skipped=skipped,
        has_resume_text=has_resume_text,
        mode=mode,
        warning=warning,
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> None:
    resume = _get_owned_resume(db, resume_id, current_user.id)
    db.delete(resume)
    db.commit()

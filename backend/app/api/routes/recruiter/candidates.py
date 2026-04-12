from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_recruiter
from app.api.deps.db import get_db
from app.models.analysis import Analysis
from app.models.enums import AnalysisStatus, ResumeProcessingStatus
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.models.user import User
from app.services.analysis_matching import MATCH_MODEL_NAME, compute_match_result
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
    created_at: datetime
    best_match_job: str | None
    best_match_score: float | None
    status: ResumeProcessingStatus


class JobMatchDetail(BaseModel):
    job_id: str
    job_title: str
    overall_score: float
    matching_keywords: list[str]
    missing_keywords: list[str]


class TopRecommendation(BaseModel):
    job_title: str
    reason: str


class CandidateDetail(BaseModel):
    id: str
    title: str
    created_at: datetime
    skills: list[str]
    matches: list[JobMatchDetail]
    top_recommendation: TopRecommendation | None


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
    """Compute a match and persist it. Returns None if text is unavailable."""
    resume_text = resume.normalized_text or resume.raw_text or ""
    job_text = job.normalized_text or job.source_text or ""

    if not resume_text or not job_text:
        return None

    try:
        result = compute_match_result(resume_text, job_text)
    except ValueError:
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


def _keywords_from_payload(payload: dict | None, key: str) -> list[str]:
    if not payload:
        return []
    value = payload.get(key, [])
    return [str(k) for k in value if k] if isinstance(value, list) else []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/upload", response_model=CandidateUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_candidates(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> CandidateUploadResponse:
    """Upload one or more resume files, extract text, and analyze against all recruiter jobs."""
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
    """List all resumes uploaded by this recruiter with their best-matching job."""
    resumes = list(
        db.scalars(
            select(Resume)
            .where(Resume.user_id == current_user.id)
            .order_by(Resume.created_at.desc())
        )
    )

    result: list[CandidateListItem] = []
    for resume in resumes:
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

        if best_analysis:
            job = db.get(JobDescription, best_analysis.job_description_id)
            best_job_title = job.title if job else None
            best_score = float(best_analysis.overall_score)

        result.append(
            CandidateListItem(
                id=resume.id,
                title=resume.title,
                created_at=resume.created_at,
                best_match_job=best_job_title,
                best_match_score=best_score,
                status=resume.processing_status,
            )
        )

    return result


@router.get("/{resume_id}", response_model=CandidateDetail)
def get_candidate(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> CandidateDetail:
    """Return full candidate detail with scores against all recruiter jobs."""
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
            )
        )

    top_recommendation: TopRecommendation | None = None
    if matches and analyses:
        best = analyses[0]
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
        created_at=resume.created_at,
        skills=skills,
        matches=matches,
        top_recommendation=top_recommendation,
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
) -> None:
    """Delete a candidate resume and all associated analyses."""
    resume = _get_owned_resume(db, resume_id, current_user.id)
    db.delete(resume)
    db.commit()

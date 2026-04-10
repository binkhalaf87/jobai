from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.models.user import User
from app.schemas.analysis import (
    AnalysisAtsIssue,
    AnalysisAtsRequest,
    AnalysisAtsResponse,
    AnalysisAtsResult,
    AnalysisFullRequest,
    AnalysisFullResponse,
    AnalysisScoreBreakdown,
    AnalysisScoreRequest,
    AnalysisScoreResponse,
    AnalysisScoreResult,
    FullAnalysisResult,
    ScoreBreakdownItem,
    AnalysisMatchRequest,
    AnalysisMatchResponse,
    AnalysisMatchResult,
)
from app.services.analysis_ats import create_ats_analysis
from app.services.analysis_orchestrator import run_full_analysis
from app.schemas.job_description import JobDescriptionCreate, JobDescriptionSubmitResponse
from app.schemas.rewrite_suggestion import RewriteSuggestionGenerateRequest, RewriteSuggestionGenerateResponse, RewriteSuggestionRead
from app.services.analysis_matching import (
    create_match_analysis,
    get_user_job_description_for_analysis,
    get_user_resume_for_analysis,
)
from app.services.rewrite_engine import get_user_analysis_for_rewrite, replace_rewrite_suggestions
from app.services.analysis_scoring import create_scoring_analysis
from app.services.job_descriptions import create_job_description
from app.services.resume_preview import build_text_preview

# This router is reserved for analysis preparation, requests, and result retrieval.
router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/status")
def analysis_status() -> dict[str, str]:
    """Placeholder endpoint confirming the analysis route group is wired."""
    return {"status": "analysis routes ready"}


@router.post("/job-description", response_model=JobDescriptionSubmitResponse, status_code=status.HTTP_201_CREATED)
def submit_job_description(
    payload: JobDescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JobDescriptionSubmitResponse:
    """Store a normalized job description that can later be paired with resume analysis."""
    if not payload.source_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job description text is required.")

    job_description = create_job_description(db, current_user, payload)
    return JobDescriptionSubmitResponse(
        job_description_id=job_description.id,
        title=job_description.title,
        normalized_text_preview=build_text_preview(job_description.normalized_text),
        keyword_data=job_description.keyword_data,
    )


@router.post("/match", response_model=AnalysisMatchResponse, status_code=status.HTTP_201_CREATED)
def match_resume_to_job_description(
    payload: AnalysisMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalysisMatchResponse:
    """Run a deterministic TF-IDF resume-to-job match and persist the result."""
    resume = get_user_resume_for_analysis(db, current_user.id, payload.resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    job_description = get_user_job_description_for_analysis(db, current_user.id, payload.job_description_id)
    if not job_description:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found.")

    if not resume.normalized_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume does not have normalized text available for matching.",
        )

    if not job_description.normalized_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description does not have normalized text available for matching.",
        )

    try:
        analysis = create_match_analysis(db, current_user.id, resume, job_description)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    result = analysis.result_payload or {}
    return AnalysisMatchResponse(
        analysis_id=analysis.id,
        resume_id=analysis.resume_id,
        job_description_id=analysis.job_description_id,
        result=AnalysisMatchResult(
            match_score=float(result.get("match_score", 0)),
            matching_keywords=list(result.get("matching_keywords", [])),
            missing_keywords=list(result.get("missing_keywords", [])),
            cosine_similarity_score=float(result.get("cosine_similarity_score", 0)),
        ),
    )


@router.post("/ats", response_model=AnalysisAtsResponse, status_code=status.HTTP_201_CREATED)
def analyze_resume_for_ats(
    payload: AnalysisAtsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalysisAtsResponse:
    """Run explainable rule-based ATS checks for a resume against a target job description."""
    resume = get_user_resume_for_analysis(db, current_user.id, payload.resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    job_description = get_user_job_description_for_analysis(db, current_user.id, payload.job_description_id)
    if not job_description:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found.")

    if not resume.normalized_text or not resume.structured_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume does not have enough parsed content for ATS analysis.",
        )

    if not job_description.normalized_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description does not have normalized text available for ATS analysis.",
        )

    analysis = create_ats_analysis(db, current_user.id, resume, job_description)
    result = analysis.result_payload or {}
    issue_payloads = result.get("issues", [])

    return AnalysisAtsResponse(
        analysis_id=analysis.id,
        resume_id=analysis.resume_id,
        job_description_id=analysis.job_description_id,
        result=AnalysisAtsResult(
            ats_score=float(result.get("ats_score", 0)),
            issues=[
                AnalysisAtsIssue(
                    category=str(issue.get("category", "")),
                    severity=str(issue.get("severity", "")),
                    message=str(issue.get("message", "")),
                )
                for issue in issue_payloads
            ],
            suggestions=list(result.get("suggestions", [])),
        ),
    )


@router.post("/score", response_model=AnalysisScoreResponse, status_code=status.HTTP_201_CREATED)
def score_resume_against_job_description(
    payload: AnalysisScoreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalysisScoreResponse:
    """Compute the weighted scoring breakdown for a resume against a job description."""
    resume = get_user_resume_for_analysis(db, current_user.id, payload.resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    job_description = get_user_job_description_for_analysis(db, current_user.id, payload.job_description_id)
    if not job_description:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found.")

    if not resume.normalized_text or not resume.structured_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume does not have enough parsed content for scoring.",
        )

    if not job_description.normalized_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description does not have normalized text available for scoring.",
        )

    analysis = create_scoring_analysis(db, current_user.id, resume, job_description)
    result = analysis.result_payload or {}
    breakdown = result.get("detailed_score_breakdown", {})

    return AnalysisScoreResponse(
        analysis_id=analysis.id,
        resume_id=analysis.resume_id,
        job_description_id=analysis.job_description_id,
        result=AnalysisScoreResult(
            overall_score=float(result.get("overall_score", 0)),
            detailed_score_breakdown=AnalysisScoreBreakdown(
                match=ScoreBreakdownItem(**breakdown.get("match", {"score": 0, "weight": 0, "weighted_score": 0})),
                ats=ScoreBreakdownItem(**breakdown.get("ats", {"score": 0, "weight": 0, "weighted_score": 0})),
                content=ScoreBreakdownItem(**breakdown.get("content", {"score": 0, "weight": 0, "weighted_score": 0})),
                completeness=ScoreBreakdownItem(
                    **breakdown.get("completeness", {"score": 0, "weight": 0, "weighted_score": 0})
                ),
            ),
            explanation=str(result.get("explanation", "")),
        ),
    )


@router.post("/analyze", response_model=AnalysisFullResponse, status_code=status.HTTP_201_CREATED)
def analyze_resume_against_job_description(
    payload: AnalysisFullRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalysisFullResponse:
    """Run the full deterministic analysis flow and persist a single combined analysis record."""
    resume = get_user_resume_for_analysis(db, current_user.id, payload.resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    job_description = get_user_job_description_for_analysis(db, current_user.id, payload.job_description_id)
    if not job_description:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found.")

    try:
        analysis = run_full_analysis(db, current_user.id, resume, job_description)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    result = analysis.result_payload or {}
    match_payload = result.get("match", {})
    ats_payload = result.get("ats", {})
    score_payload = result.get("score", {})
    breakdown = score_payload.get("detailed_score_breakdown", {})

    return AnalysisFullResponse(
        analysis_id=analysis.id,
        resume_id=analysis.resume_id,
        job_description_id=analysis.job_description_id,
        result=FullAnalysisResult(
            job_description_keywords=dict(result.get("job_description_keywords", {})),
            match=AnalysisMatchResult(
                match_score=float(match_payload.get("match_score", 0)),
                matching_keywords=list(match_payload.get("matching_keywords", [])),
                missing_keywords=list(match_payload.get("missing_keywords", [])),
                cosine_similarity_score=float(match_payload.get("cosine_similarity_score", 0)),
            ),
            ats=AnalysisAtsResult(
                ats_score=float(ats_payload.get("ats_score", 0)),
                issues=[
                    AnalysisAtsIssue(
                        category=str(issue.get("category", "")),
                        severity=str(issue.get("severity", "")),
                        message=str(issue.get("message", "")),
                    )
                    for issue in ats_payload.get("issues", [])
                ],
                suggestions=list(ats_payload.get("suggestions", [])),
            ),
            score=AnalysisScoreResult(
                overall_score=float(score_payload.get("overall_score", 0)),
                detailed_score_breakdown=AnalysisScoreBreakdown(
                    match=ScoreBreakdownItem(**breakdown.get("match", {"score": 0, "weight": 0, "weighted_score": 0})),
                    ats=ScoreBreakdownItem(**breakdown.get("ats", {"score": 0, "weight": 0, "weighted_score": 0})),
                    content=ScoreBreakdownItem(**breakdown.get("content", {"score": 0, "weight": 0, "weighted_score": 0})),
                    completeness=ScoreBreakdownItem(
                        **breakdown.get("completeness", {"score": 0, "weight": 0, "weighted_score": 0})
                    ),
                ),
                explanation=str(score_payload.get("explanation", "")),
            ),
        ),
    )


@router.post("/rewrite", response_model=RewriteSuggestionGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_resume_rewrite_suggestions(
    payload: RewriteSuggestionGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RewriteSuggestionGenerateResponse:
    """Generate and store three AI-powered rewrite suggestions for one resume bullet or section."""
    analysis = get_user_analysis_for_rewrite(db, current_user.id, payload.analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    try:
        suggestions = replace_rewrite_suggestions(
            db=db,
            analysis=analysis,
            section=payload.section,
            source_text=payload.source_text,
            missing_keywords=payload.missing_keywords,
            anchor_label=payload.anchor_label,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Rewrite generation failed while calling the OpenAI API.",
        ) from exc

    return RewriteSuggestionGenerateResponse(
        analysis_id=analysis.id,
        section=payload.section,
        suggestions=[RewriteSuggestionRead.model_validate(suggestion) for suggestion in suggestions],
    )

from dataclasses import asdict, dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.enums import AnalysisStatus
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.services.analysis_ats import AtsResult, run_ats_analysis
from app.services.analysis_matching import MatchResult, compute_match_result
from app.services.analysis_scoring import ScoringResult, compose_scoring_result
from app.services.job_descriptions import ensure_job_description_keywords

FULL_ANALYSIS_MODEL_NAME = "full-analysis-v1"


@dataclass(frozen=True)
class FullAnalysisResult:
    """Complete deterministic analysis bundle returned by the orchestration service."""

    job_description_keywords: dict
    match: dict
    ats: dict
    score: dict

    def to_payload(self) -> dict:
        """Convert the full analysis into a JSON-serializable payload."""
        return asdict(self)


def validate_analysis_inputs(resume: Resume, job_description: JobDescription) -> None:
    """Ensure the stored inputs are ready for a full deterministic analysis."""
    if not resume.normalized_text:
        raise ValueError("Resume does not have normalized text available for analysis.")

    if not resume.structured_data:
        raise ValueError("Resume does not have parsed structured data available for analysis.")

    if not job_description.normalized_text:
        raise ValueError("Job description does not have normalized text available for analysis.")


def build_full_analysis_result(
    resume: Resume,
    job_description: JobDescription,
    match_result: MatchResult,
    ats_result: AtsResult,
    scoring_result: ScoringResult,
) -> FullAnalysisResult:
    """Assemble the complete analysis payload from the deterministic component engines."""
    return FullAnalysisResult(
        job_description_keywords=job_description.keyword_data or {},
        match=match_result.to_payload(),
        ats=ats_result.to_payload(),
        score=scoring_result.to_payload(),
    )


def run_full_analysis(db: Session, user_id: str, resume: Resume, job_description: JobDescription) -> Analysis:
    """Run deterministic keyword, match, ATS, and scoring analysis and persist a single Analysis record."""
    job_description = ensure_job_description_keywords(db, job_description)
    validate_analysis_inputs(resume, job_description)

    match_result = compute_match_result(resume.normalized_text or "", job_description.normalized_text or "")
    ats_result = run_ats_analysis(resume, job_description)
    scoring_result = compose_scoring_result(resume, job_description, match_result, ats_result)
    full_result = build_full_analysis_result(resume, job_description, match_result, ats_result, scoring_result)

    analysis = Analysis(
        user_id=user_id,
        resume_id=resume.id,
        job_description_id=job_description.id,
        status=AnalysisStatus.COMPLETED,
        model_name=FULL_ANALYSIS_MODEL_NAME,
        overall_score=scoring_result.overall_score,
        summary_text=scoring_result.explanation,
        result_payload=full_result.to_payload(),
        completed_at=datetime.now(timezone.utc),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis

from dataclasses import asdict, dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.enums import AnalysisStatus
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.services.analysis_ats import AtsResult, MEASURABLE_ACHIEVEMENT_PATTERN, run_ats_analysis
from app.services.analysis_matching import MatchResult, compute_match_result

SCORING_MODEL_NAME = "composite-score-v1"
MATCH_WEIGHT = 0.40
ATS_WEIGHT = 0.25
CONTENT_WEIGHT = 0.20
COMPLETENESS_WEIGHT = 0.15


@dataclass(frozen=True)
class ScoreComponent:
    """Single scoring component with a weighted contribution."""

    score: float
    weight: float
    weighted_score: float


@dataclass(frozen=True)
class ScoringResult:
    """Composite scoring result returned to the API layer."""

    overall_score: float
    detailed_score_breakdown: dict[str, dict[str, float]]
    explanation: str

    def to_payload(self) -> dict:
        """Convert the scoring result into a JSON-serializable payload."""
        return asdict(self)


def build_component(score: float, weight: float) -> ScoreComponent:
    """Create a normalized weighted score component."""
    normalized_score = round(max(0.0, min(score, 100.0)), 2)
    return ScoreComponent(
        score=normalized_score,
        weight=weight,
        weighted_score=round(normalized_score * weight, 2),
    )


def compute_content_score(resume: Resume, job_description: JobDescription, match_score: float) -> float:
    """Score content quality based on structured resume signals and keyword fit."""
    structured = resume.structured_data or {}
    score = 100.0

    summary = structured.get("summary") or ""
    skills = structured.get("skills") or []
    experience = structured.get("experience") or []
    combined_experience = "\n".join(experience)
    keyword_data = job_description.keyword_data or {}
    target_keywords = set(
        keyword.lower()
        for keyword in [
            *keyword_data.get("hard_skills", []),
            *keyword_data.get("tools", []),
            *keyword_data.get("role_keywords", []),
        ]
        if keyword
    )
    matched_keywords = {keyword.lower() for keyword in target_keywords if keyword.lower() in (resume.normalized_text or "").lower()}

    if len(summary.split()) < 25:
        score -= 10

    if len(skills) < 6:
        score -= 12

    if len(experience) < 3:
        score -= 16

    if not MEASURABLE_ACHIEVEMENT_PATTERN.search(combined_experience):
        score -= 18

    if target_keywords:
        keyword_coverage = len(matched_keywords) / max(len(target_keywords), 1)
        if keyword_coverage < 0.35:
            score -= 18
        elif keyword_coverage < 0.55:
            score -= 10

    if match_score < 35:
        score -= 10

    return round(max(score, 0.0), 2)


def compute_completeness_score(resume: Resume) -> float:
    """Score how complete the resume appears based on core sections and parsed data."""
    structured = resume.structured_data or {}
    score = 0.0

    if structured.get("name"):
        score += 20
    if structured.get("summary"):
        score += 20
    if structured.get("skills"):
        score += 20
    if structured.get("experience"):
        score += 25
    if structured.get("education"):
        score += 15

    if resume.source_filename:
        score += 5
    if resume.normalized_text:
        score += 5

    return round(min(score, 100.0), 2)


def build_score_explanation(
    overall_score: float,
    match_score: float,
    ats_score: float,
    content_score: float,
    completeness_score: float,
) -> str:
    """Generate a human-readable explanation of the weighted score."""
    strongest_component_name, strongest_component_score = max(
        [
            ("match", match_score),
            ("ATS", ats_score),
            ("content", content_score),
            ("completeness", completeness_score),
        ],
        key=lambda item: item[1],
    )
    weakest_component_name, weakest_component_score = min(
        [
            ("match", match_score),
            ("ATS", ats_score),
            ("content", content_score),
            ("completeness", completeness_score),
        ],
        key=lambda item: item[1],
    )

    return (
        f"Overall score is {overall_score:.2f}/100 based on weighted match, ATS, content, and completeness checks. "
        f"The strongest component is {strongest_component_name} at {strongest_component_score:.2f}, "
        f"while the weakest is {weakest_component_name} at {weakest_component_score:.2f} and should be improved first."
    )


def compose_scoring_result(resume: Resume, job_description: JobDescription, match_result: MatchResult, ats_result: AtsResult) -> ScoringResult:
    """Compose the weighted scoring result from existing deterministic analysis outputs."""
    content_score = compute_content_score(resume, job_description, match_result.match_score)
    completeness_score = compute_completeness_score(resume)

    match_component = build_component(match_result.match_score, MATCH_WEIGHT)
    ats_component = build_component(ats_result.ats_score, ATS_WEIGHT)
    content_component = build_component(content_score, CONTENT_WEIGHT)
    completeness_component = build_component(completeness_score, COMPLETENESS_WEIGHT)

    overall_score = round(
        match_component.weighted_score
        + ats_component.weighted_score
        + content_component.weighted_score
        + completeness_component.weighted_score,
        2,
    )

    return ScoringResult(
        overall_score=overall_score,
        detailed_score_breakdown={
            "match": asdict(match_component),
            "ats": asdict(ats_component),
            "content": asdict(content_component),
            "completeness": asdict(completeness_component),
        },
        explanation=build_score_explanation(
            overall_score=overall_score,
            match_score=match_component.score,
            ats_score=ats_component.score,
            content_score=content_component.score,
            completeness_score=completeness_component.score,
        ),
    )


def compute_scoring_result(resume: Resume, job_description: JobDescription) -> ScoringResult:
    """Compute the weighted overall score and a detailed deterministic breakdown."""
    match_result = compute_match_result(resume.normalized_text or "", job_description.normalized_text or "")
    ats_result = run_ats_analysis(resume, job_description)
    return compose_scoring_result(resume, job_description, match_result, ats_result)


def create_scoring_analysis(db: Session, user_id: str, resume: Resume, job_description: JobDescription) -> Analysis:
    """Persist a completed composite scoring analysis."""
    result = compute_scoring_result(resume, job_description)

    analysis = Analysis(
        user_id=user_id,
        resume_id=resume.id,
        job_description_id=job_description.id,
        status=AnalysisStatus.COMPLETED,
        model_name=SCORING_MODEL_NAME,
        overall_score=result.overall_score,
        summary_text=result.explanation,
        result_payload=result.to_payload(),
        completed_at=datetime.now(timezone.utc),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis

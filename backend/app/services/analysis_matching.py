from dataclasses import asdict, dataclass
from datetime import datetime, timezone

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.enums import AnalysisStatus
from app.models.job_description import JobDescription
from app.models.resume import Resume

MATCH_MODEL_NAME = "tfidf-cosine-v1"
KEYWORD_LIMIT = 15


@dataclass(frozen=True)
class MatchResult:
    """Deterministic TF-IDF match result between a resume and a job description."""

    match_score: float
    matching_keywords: list[str]
    missing_keywords: list[str]
    cosine_similarity_score: float

    def to_payload(self) -> dict:
        """Convert the match result into a JSON-serializable payload."""
        return asdict(self)


def get_user_resume_for_analysis(db: Session, user_id: str, resume_id: str) -> Resume | None:
    """Load a user-owned resume for matching."""
    statement = select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
    return db.scalar(statement)


def get_user_job_description_for_analysis(db: Session, user_id: str, job_description_id: str) -> JobDescription | None:
    """Load a user-owned job description for matching."""
    statement = select(JobDescription).where(JobDescription.id == job_description_id, JobDescription.user_id == user_id)
    return db.scalar(statement)


def build_vectorizer() -> TfidfVectorizer:
    """Create a deterministic TF-IDF vectorizer for resume and role matching."""
    return TfidfVectorizer(
        stop_words="english",
        lowercase=True,
        ngram_range=(1, 2),
        token_pattern=r"(?u)\b[a-zA-Z][a-zA-Z0-9.+#/-]{1,}\b",
    )


def compute_match_result(resume_text: str, job_text: str) -> MatchResult:
    """Compute a cosine similarity score and keyword overlap using TF-IDF features."""
    resume_clean = resume_text.strip()
    job_clean = job_text.strip()

    if not resume_clean or not job_clean:
        raise ValueError("Both normalized resume text and normalized job description text are required.")

    vectorizer = build_vectorizer()
    matrix = vectorizer.fit_transform([resume_clean, job_clean])
    resume_vector = matrix[0]
    job_vector = matrix[1]

    similarity = float(cosine_similarity(resume_vector, job_vector)[0][0])
    match_score = round(similarity * 100, 2)

    feature_names = vectorizer.get_feature_names_out()
    resume_present_indices = set(resume_vector.nonzero()[1].tolist())
    job_term_weights = job_vector.toarray()[0]
    ranked_job_indices = job_term_weights.argsort()[::-1]

    matching_keywords: list[str] = []
    missing_keywords: list[str] = []

    for index in ranked_job_indices:
        weight = float(job_term_weights[index])
        if weight <= 0:
            continue

        term = feature_names[index]

        if index in resume_present_indices:
            if term not in matching_keywords:
                matching_keywords.append(term)
        else:
            if term not in missing_keywords:
                missing_keywords.append(term)

        if len(matching_keywords) >= KEYWORD_LIMIT and len(missing_keywords) >= KEYWORD_LIMIT:
            break

    return MatchResult(
        match_score=match_score,
        matching_keywords=matching_keywords[:KEYWORD_LIMIT],
        missing_keywords=missing_keywords[:KEYWORD_LIMIT],
        cosine_similarity_score=round(similarity, 4),
    )


def create_match_analysis(db: Session, user_id: str, resume: Resume, job_description: JobDescription) -> Analysis:
    """Persist a completed deterministic match analysis."""
    result = compute_match_result(
        resume_text=resume.normalized_text or "",
        job_text=job_description.normalized_text or "",
    )

    analysis = Analysis(
        user_id=user_id,
        resume_id=resume.id,
        job_description_id=job_description.id,
        status=AnalysisStatus.COMPLETED,
        model_name=MATCH_MODEL_NAME,
        overall_score=result.match_score,
        summary_text=(
            f"Deterministic TF-IDF match completed with {result.match_score:.2f}% similarity "
            f"and {len(result.matching_keywords)} matching keywords."
        ),
        result_payload=result.to_payload(),
        completed_at=datetime.now(timezone.utc),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import re

from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.enums import AnalysisStatus
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.services.resume_parser import collect_sections, split_section_blocks

ATS_MODEL_NAME = "ats-rule-v1"
MEASURABLE_ACHIEVEMENT_PATTERN = re.compile(r"(\d+%|\$\d+|\d+\+|\d+\s*(?:million|billion|k|m)\b)", re.I)
FORMATTING_RISK_PATTERN = re.compile(r"[|]{2,}|[_]{3,}|[^\x00-\x7F]{3,}")


@dataclass(frozen=True)
class AtsIssue:
    """Single explainable ATS issue discovered by rule-based checks."""

    category: str
    severity: str
    message: str


@dataclass(frozen=True)
class AtsResult:
    """Structured ATS analysis output returned to the API layer."""

    ats_score: float
    issues: list[dict]
    suggestions: list[str]

    def to_payload(self) -> dict:
        """Convert the result into a JSON-serializable payload."""
        return asdict(self)


def build_issue(category: str, severity: str, message: str) -> AtsIssue:
    """Create a normalized ATS issue object."""
    return AtsIssue(category=category, severity=severity, message=message)


def get_resume_sections(resume: Resume) -> dict[str, list[str]]:
    """Reconstruct section content from normalized resume text."""
    normalized_text = resume.normalized_text or ""
    lines = [line.rstrip() for line in normalized_text.split("\n")]
    sections, _ = collect_sections(lines)
    return sections


def collect_missing_section_issues(resume: Resume) -> tuple[list[AtsIssue], int]:
    """Check whether core ATS-relevant sections are present."""
    structured = resume.structured_data or {}
    issues: list[AtsIssue] = []
    penalty = 0

    checks = [
        ("name", structured.get("name"), 8, "Add a clear name/header at the top of the resume."),
        ("summary", structured.get("summary"), 10, "Add a short professional summary section."),
        ("skills", structured.get("skills"), 12, "Add a dedicated skills section with role-relevant keywords."),
        ("experience", structured.get("experience"), 15, "Add a work experience section with recent roles and outcomes."),
        ("education", structured.get("education"), 8, "Add an education section so screening systems can parse it easily."),
    ]

    for category, value, category_penalty, message in checks:
        is_missing = not value or (isinstance(value, list) and len(value) == 0)
        if is_missing:
            issues.append(build_issue(f"missing_{category}", "high", message))
            penalty += category_penalty

    return issues, penalty


def collect_bullet_structure_issues(resume: Resume) -> tuple[list[AtsIssue], int]:
    """Check whether experience content uses concise bullet structure."""
    sections = get_resume_sections(resume)
    experience_lines = [line for line in sections.get("experience", []) if line.strip()]

    if not experience_lines:
        return [], 0

    bullet_lines = [line for line in experience_lines if line.lstrip().startswith(("-", "*"))]
    bullet_ratio = len(bullet_lines) / max(len(experience_lines), 1)

    if bullet_ratio >= 0.35:
        return [], 0

    issue = build_issue(
        "weak_bullet_structure",
        "medium",
        "Experience content is not consistently written as short bullets, which can reduce ATS readability.",
    )
    return [issue], 12


def collect_long_paragraph_issues(resume: Resume) -> tuple[list[AtsIssue], int]:
    """Flag paragraphs that are likely too dense for ATS-friendly scanning."""
    blocks = split_section_blocks((resume.normalized_text or "").split("\n"))
    long_blocks = [block for block in blocks if len(block.split()) >= 80]

    if not long_blocks:
        return [], 0

    issue = build_issue(
        "long_paragraphs",
        "medium",
        f"Detected {len(long_blocks)} long paragraph(s). Break dense content into shorter bullets or smaller sections.",
    )
    return [issue], min(18, len(long_blocks) * 6)


def collect_keyword_coverage_issues(resume: Resume, job_description: JobDescription) -> tuple[list[AtsIssue], int]:
    """Compare resume text against stored job-description keywords."""
    keyword_data = job_description.keyword_data or {}
    expected_keywords = [
        *keyword_data.get("hard_skills", []),
        *keyword_data.get("tools", []),
        *keyword_data.get("job_titles", []),
        *keyword_data.get("role_keywords", []),
    ]
    expected_keywords = [keyword.lower() for keyword in expected_keywords if keyword]

    if not expected_keywords:
        return [], 0

    resume_text = (resume.normalized_text or "").lower()
    matching_keywords = [keyword for keyword in expected_keywords if keyword in resume_text]
    coverage = len(set(matching_keywords)) / max(len(set(expected_keywords)), 1)

    if coverage >= 0.6:
        return [], 0

    severity = "high" if coverage < 0.4 else "medium"
    penalty = 18 if coverage < 0.4 else 10
    issue = build_issue(
        "low_keyword_coverage",
        severity,
        f"Keyword coverage is low at {coverage * 100:.0f}% against the saved job description.",
    )
    return [issue], penalty


def collect_measurable_achievement_issues(resume: Resume) -> tuple[list[AtsIssue], int]:
    """Detect whether experience text includes measurable outcomes."""
    experience_blocks = (resume.structured_data or {}).get("experience", [])
    if not experience_blocks:
        return [], 0

    combined_experience = "\n".join(experience_blocks)
    if MEASURABLE_ACHIEVEMENT_PATTERN.search(combined_experience):
        return [], 0

    issue = build_issue(
        "lack_of_measurable_achievements",
        "medium",
        "Experience bullets do not show measurable achievements such as percentages, revenue, or delivery counts.",
    )
    return [issue], 14


def collect_formatting_risk_issues(resume: Resume) -> tuple[list[AtsIssue], int]:
    """Flag formatting patterns that may make ATS parsing less reliable."""
    normalized_text = resume.normalized_text or ""
    lines = normalized_text.split("\n")
    long_lines = [line for line in lines if len(line) > 140]
    has_risky_symbols = bool(FORMATTING_RISK_PATTERN.search(normalized_text))

    if not long_lines and not has_risky_symbols:
        return [], 0

    issue = build_issue(
        "formatting_risks",
        "medium",
        "Formatting patterns such as very long lines or decorative separators may reduce ATS parsing reliability.",
    )
    return [issue], 10


def build_suggestions_from_issues(issues: list[AtsIssue]) -> list[str]:
    """Generate actionable ATS suggestions from discovered issues."""
    suggestions_map = {
        "missing_name": "Place your full name and contact header clearly at the top of the document.",
        "missing_summary": "Add a concise summary aligned to the target role.",
        "missing_skills": "Create a dedicated skills section and include role-specific tools and hard skills.",
        "missing_experience": "Include a clear work experience section with recent roles and outcomes.",
        "missing_education": "Add education details so ATS systems can parse credentials reliably.",
        "weak_bullet_structure": "Rewrite experience entries into short bullet points that start with strong action verbs.",
        "long_paragraphs": "Break long paragraphs into concise bullets or shorter grouped statements.",
        "low_keyword_coverage": "Mirror important job-description terms naturally throughout the summary, skills, and experience sections.",
        "lack_of_measurable_achievements": "Add measurable outcomes such as percentages, counts, cost savings, or delivery impact.",
        "formatting_risks": "Use simple headings, consistent spacing, and avoid decorative separators or unusual layout markers.",
    }

    ordered_suggestions: list[str] = []
    seen: set[str] = set()

    for issue in issues:
        suggestion = suggestions_map.get(issue.category)
        if suggestion and suggestion not in seen:
            seen.add(suggestion)
            ordered_suggestions.append(suggestion)

    return ordered_suggestions


def run_ats_analysis(resume: Resume, job_description: JobDescription) -> AtsResult:
    """Run deterministic ATS checks against a resume and its target job description."""
    issue_groups = [
        collect_missing_section_issues(resume),
        collect_bullet_structure_issues(resume),
        collect_long_paragraph_issues(resume),
        collect_keyword_coverage_issues(resume, job_description),
        collect_measurable_achievement_issues(resume),
        collect_formatting_risk_issues(resume),
    ]

    issues: list[AtsIssue] = []
    total_penalty = 0

    for group_issues, penalty in issue_groups:
        issues.extend(group_issues)
        total_penalty += penalty

    ats_score = max(0.0, round(100 - total_penalty, 2))
    suggestions = build_suggestions_from_issues(issues)

    return AtsResult(
        ats_score=ats_score,
        issues=[asdict(issue) for issue in issues],
        suggestions=suggestions,
    )


def create_ats_analysis(db: Session, user_id: str, resume: Resume, job_description: JobDescription) -> Analysis:
    """Persist a completed ATS analysis as an Analysis record."""
    result = run_ats_analysis(resume, job_description)

    analysis = Analysis(
        user_id=user_id,
        resume_id=resume.id,
        job_description_id=job_description.id,
        status=AnalysisStatus.COMPLETED,
        model_name=ATS_MODEL_NAME,
        overall_score=result.ats_score,
        summary_text=(
            f"Rule-based ATS analysis completed with a score of {result.ats_score:.2f} "
            f"and {len(result.issues)} issue(s) detected."
        ),
        result_payload=result.to_payload(),
        completed_at=datetime.now(timezone.utc),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis

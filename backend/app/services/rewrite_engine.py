from dataclasses import dataclass
import json
import re

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.openai_client import get_openai_client
from app.models.analysis import Analysis
from app.models.enums import SuggestionSection
from app.models.rewrite_suggestion import RewriteSuggestion

REWRITE_SUGGESTION_COUNT = 3
MAX_MISSING_KEYWORDS = 8
DEFAULT_REWRITE_MODEL = "gpt-5-mini"
JSON_BLOCK_PATTERN = re.compile(r"```json\s*(\{.*?\})\s*```", re.DOTALL)


@dataclass(frozen=True)
class GeneratedRewriteSuggestion:
    """Single AI-generated rewrite suggestion before it is persisted."""

    suggested_text: str
    rationale: str


def get_rewrite_model_name() -> str:
    """Resolve the model used for rewrite generation."""
    settings = get_settings()
    return getattr(settings, "openai_rewrite_model", DEFAULT_REWRITE_MODEL)


def get_user_analysis_for_rewrite(db: Session, user_id: str, analysis_id: str) -> Analysis | None:
    """Load a user-owned analysis record so rewrite suggestions can be stored against it."""
    statement = select(Analysis).where(Analysis.id == analysis_id, Analysis.user_id == user_id)
    return db.scalar(statement)


def normalize_missing_keywords(missing_keywords: list[str]) -> list[str]:
    """Trim, deduplicate, and cap missing keywords before sending them to the model."""
    normalized_keywords: list[str] = []
    seen: set[str] = set()

    for keyword in missing_keywords:
        cleaned_keyword = keyword.strip()
        lowered_keyword = cleaned_keyword.lower()

        if not cleaned_keyword or lowered_keyword in seen:
            continue

        seen.add(lowered_keyword)
        normalized_keywords.append(cleaned_keyword)

        if len(normalized_keywords) >= MAX_MISSING_KEYWORDS:
            break

    return normalized_keywords


def build_rewrite_prompt(source_text: str, missing_keywords: list[str]) -> str:
    """Build a focused prompt that keeps resume rewrites concise, natural, and specific."""
    keywords_text = ", ".join(missing_keywords)

    return (
        "Rewrite the following resume bullet or section into exactly three improved versions.\n"
        "Requirements:\n"
        "- Keep each version natural, concise, and specific.\n"
        "- Avoid generic wording, buzzwords, and keyword stuffing.\n"
        "- Include the missing keywords naturally when they fit.\n"
        "- Do not invent facts, metrics, tools, or responsibilities that are not implied by the original text.\n"
        "- Preserve the original meaning while improving clarity and relevance.\n"
        "- Return valid JSON only using this shape:\n"
        '{\n'
        '  "suggestions": [\n'
        '    {"suggested_text": "string", "rationale": "string"}\n'
        "  ]\n"
        "}\n\n"
        f"Original text:\n{source_text}\n\n"
        f"Missing keywords to weave in naturally when appropriate:\n{keywords_text}"
    )


def extract_json_payload(raw_output: str) -> dict:
    """Extract a JSON object from a model response that may include markdown fences."""
    stripped_output = raw_output.strip()
    fenced_match = JSON_BLOCK_PATTERN.search(stripped_output)

    if fenced_match:
        stripped_output = fenced_match.group(1).strip()

    return json.loads(stripped_output)


def parse_generated_suggestions(raw_output: str) -> list[GeneratedRewriteSuggestion]:
    """Parse and validate the rewrite payload returned by the model."""
    payload = extract_json_payload(raw_output)
    suggestions = payload.get("suggestions")

    if not isinstance(suggestions, list) or len(suggestions) != REWRITE_SUGGESTION_COUNT:
        raise ValueError("OpenAI did not return exactly three rewrite suggestions.")

    parsed_suggestions: list[GeneratedRewriteSuggestion] = []

    for suggestion in suggestions:
        if not isinstance(suggestion, dict):
            raise ValueError("OpenAI returned an invalid rewrite suggestion payload.")

        suggested_text = str(suggestion.get("suggested_text", "")).strip()
        rationale = str(suggestion.get("rationale", "")).strip()

        if not suggested_text:
            raise ValueError("OpenAI returned an empty rewrite suggestion.")

        parsed_suggestions.append(
            GeneratedRewriteSuggestion(
                suggested_text=suggested_text,
                rationale=rationale or "Improves clarity and keyword relevance while keeping the wording natural.",
            )
        )

    return parsed_suggestions


def generate_rewrite_suggestions(source_text: str, missing_keywords: list[str]) -> list[GeneratedRewriteSuggestion]:
    """Call the OpenAI Responses API to generate three natural rewrite suggestions."""
    normalized_keywords = normalize_missing_keywords(missing_keywords)
    cleaned_source_text = source_text.strip()

    if not cleaned_source_text:
        raise ValueError("Source text is required to generate rewrite suggestions.")

    if not normalized_keywords:
        raise ValueError("At least one missing keyword is required to generate rewrites.")

    client = get_openai_client()
    try:
        response = client.responses.create(
            model=get_rewrite_model_name(),
            input=build_rewrite_prompt(cleaned_source_text, normalized_keywords),
        )
    except Exception as exc:
        raise RuntimeError("OpenAI request failed while generating rewrite suggestions.") from exc

    raw_output = (response.output_text or "").strip()

    if not raw_output:
        raise RuntimeError("OpenAI did not return any rewrite text.")

    try:
        return parse_generated_suggestions(raw_output)
    except ValueError as exc:
        raise RuntimeError("OpenAI returned an invalid rewrite response.") from exc


def replace_rewrite_suggestions(
    db: Session,
    analysis: Analysis,
    section: SuggestionSection,
    source_text: str,
    missing_keywords: list[str],
    anchor_label: str | None = None,
) -> list[RewriteSuggestion]:
    """Generate and persist rewrite suggestions for one source text scope."""
    generated_suggestions = generate_rewrite_suggestions(source_text, missing_keywords)

    delete_statement = delete(RewriteSuggestion).where(
        RewriteSuggestion.analysis_id == analysis.id,
        RewriteSuggestion.section == section,
        RewriteSuggestion.original_text == source_text.strip(),
    )

    if anchor_label:
        delete_statement = delete_statement.where(RewriteSuggestion.anchor_label == anchor_label.strip())
    else:
        delete_statement = delete_statement.where(RewriteSuggestion.anchor_label.is_(None))

    db.execute(delete_statement)

    persisted_suggestions: list[RewriteSuggestion] = []
    normalized_anchor_label = anchor_label.strip() if anchor_label else None

    for index, suggestion in enumerate(generated_suggestions, start=1):
        rewrite_suggestion = RewriteSuggestion(
            analysis_id=analysis.id,
            section=section,
            original_text=source_text.strip(),
            suggested_text=suggestion.suggested_text,
            rationale=suggestion.rationale,
            is_applied=False,
            display_order=index,
            anchor_label=normalized_anchor_label,
        )
        db.add(rewrite_suggestion)
        persisted_suggestions.append(rewrite_suggestion)

    db.commit()

    for suggestion in persisted_suggestions:
        db.refresh(suggestion)

    return persisted_suggestions

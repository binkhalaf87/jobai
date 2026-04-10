from collections import Counter
from dataclasses import asdict, dataclass
from functools import lru_cache
import re

import spacy
from spacy.language import Language
from spacy.matcher import Matcher, PhraseMatcher


HARD_SKILLS = [
    "python",
    "java",
    "javascript",
    "typescript",
    "sql",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "fastapi",
    "django",
    "flask",
    "react",
    "next.js",
    "node.js",
    "graphql",
    "rest api",
    "microservices",
    "machine learning",
    "data analysis",
    "etl",
    "spark",
    "pandas",
    "numpy",
    "git",
]

SOFT_SKILLS = [
    "communication",
    "leadership",
    "collaboration",
    "problem solving",
    "critical thinking",
    "time management",
    "stakeholder management",
    "adaptability",
    "teamwork",
    "mentoring",
    "ownership",
    "decision making",
    "presentation skills",
]

JOB_TITLES = [
    "software engineer",
    "senior software engineer",
    "backend engineer",
    "frontend engineer",
    "full stack engineer",
    "product manager",
    "project manager",
    "data analyst",
    "data scientist",
    "machine learning engineer",
    "devops engineer",
    "site reliability engineer",
    "qa engineer",
    "business analyst",
    "designer",
    "technical lead",
]

TOOLS = [
    "jira",
    "confluence",
    "slack",
    "figma",
    "tableau",
    "power bi",
    "airflow",
    "terraform",
    "github",
    "gitlab",
    "notion",
    "salesforce",
    "hubspot",
    "excel",
    "linux",
    "vercel",
    "railway",
]

GENERIC_ROLE_TERMS = {
    "experience",
    "skills",
    "ability",
    "knowledge",
    "team",
    "teams",
    "role",
    "responsibilities",
    "requirements",
    "preferred",
    "qualification",
    "qualifications",
    "candidate",
    "work",
    "working",
    "job",
    "company",
}


@dataclass(frozen=True)
class JobDescriptionKeywordData:
    """Structured keyword data extracted from a job description."""

    hard_skills: list[str]
    soft_skills: list[str]
    job_titles: list[str]
    tools: list[str]
    years_of_experience: list[str]
    role_keywords: list[str]

    def to_dict(self) -> dict:
        """Convert the keyword result into a JSON-serializable dictionary."""
        return asdict(self)


@lru_cache
def get_nlp() -> Language:
    """Build a lightweight English spaCy pipeline for tokenization and rule matching."""
    return spacy.blank("en")


def add_phrase_patterns(matcher: PhraseMatcher, nlp: Language, label: str, phrases: list[str]) -> None:
    """Register lowercase phrase patterns for a keyword category."""
    matcher.add(label, [nlp.make_doc(phrase) for phrase in phrases])


@lru_cache
def build_phrase_matcher() -> PhraseMatcher:
    """Create the shared phrase matcher used for skills, tools, and titles."""
    nlp = get_nlp()
    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    add_phrase_patterns(matcher, nlp, "HARD_SKILL", HARD_SKILLS)
    add_phrase_patterns(matcher, nlp, "SOFT_SKILL", SOFT_SKILLS)
    add_phrase_patterns(matcher, nlp, "JOB_TITLE", JOB_TITLES)
    add_phrase_patterns(matcher, nlp, "TOOL", TOOLS)
    return matcher


@lru_cache
def build_experience_matcher() -> Matcher:
    """Create token rules for common years-of-experience wording."""
    nlp = get_nlp()
    matcher = Matcher(nlp.vocab)
    matcher.add(
        "YEARS_EXPERIENCE",
        [
            [{"LIKE_NUM": True}, {"LOWER": {"IN": ["year", "years", "yr", "yrs"]}}],
            [{"LIKE_NUM": True}, {"TEXT": "+"}, {"LOWER": {"IN": ["year", "years", "yr", "yrs"]}}],
            [
                {"LIKE_NUM": True},
                {"LOWER": {"IN": ["to"]}},
                {"LIKE_NUM": True},
                {"LOWER": {"IN": ["year", "years", "yr", "yrs"]}},
            ],
            [
                {"LIKE_NUM": True},
                {"TEXT": "-"},
                {"LIKE_NUM": True},
                {"LOWER": {"IN": ["year", "years", "yr", "yrs"]}},
            ],
            [
                {"LOWER": {"IN": ["minimum", "at", "over"]}, "OP": "?"},
                {"LOWER": "of", "OP": "?"},
                {"LIKE_NUM": True},
                {"LOWER": {"IN": ["year", "years", "yr", "yrs"]}},
                {"LOWER": "of", "OP": "?"},
                {"LOWER": "experience", "OP": "?"},
            ],
        ],
    )
    return matcher


def unique_preserve_order(items: list[str]) -> list[str]:
    """Remove duplicates while preserving original order."""
    seen: set[str] = set()
    unique_items: list[str] = []

    for item in items:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            unique_items.append(item)

    return unique_items


def extract_phrase_matches(doc, matcher: PhraseMatcher, label: str) -> list[str]:
    """Collect phrase-matcher hits for a given label."""
    results: list[str] = []

    for match_id, start, end in matcher(doc):
        if doc.vocab.strings[match_id] == label:
            results.append(doc[start:end].text)

    return unique_preserve_order(results)


def extract_years_of_experience(doc, matcher: Matcher) -> list[str]:
    """Collect normalized years-of-experience phrases from token matches."""
    matches = [doc[start:end].text for _, start, end in matcher(doc)]
    matches.extend(
        re.findall(
            r"\b\d+(?:\+)?(?:\s*(?:-|to)\s*\d+)?\s*(?:years?|yrs?)(?:\s+of\s+experience)?\b",
            doc.text,
            re.I,
        )
    )

    # Normalize spacing in matcher output like `5 + years` -> `5+ years`.
    cleaned_matches = [re.sub(r"\s+", " ", match).replace(" +", "+").strip() for match in matches]
    return unique_preserve_order(cleaned_matches)


def extract_role_keywords(doc, excluded_terms: set[str]) -> list[str]:
    """Build a small set of role-related keywords from frequent non-stop tokens."""
    token_counts: Counter[str] = Counter()

    for token in doc:
        text = token.text.strip().lower()

        if not text or not token.is_alpha or token.is_stop or len(text) < 3:
            continue

        if text in GENERIC_ROLE_TERMS or text in excluded_terms:
            continue

        token_counts[text] += 1

    ranked_keywords = sorted(token_counts.items(), key=lambda item: (-item[1], item[0]))
    return [keyword for keyword, _ in ranked_keywords[:15]]


def extract_job_description_keywords(title: str, normalized_text: str) -> JobDescriptionKeywordData:
    """Extract structured keyword data from normalized job description text."""
    nlp = get_nlp()
    phrase_matcher = build_phrase_matcher()
    experience_matcher = build_experience_matcher()

    combined_text = "\n".join(part for part in [title.strip(), normalized_text.strip()] if part.strip())
    doc = nlp(combined_text)

    hard_skills = extract_phrase_matches(doc, phrase_matcher, "HARD_SKILL")
    soft_skills = extract_phrase_matches(doc, phrase_matcher, "SOFT_SKILL")
    job_titles = unique_preserve_order([title.strip(), *extract_phrase_matches(doc, phrase_matcher, "JOB_TITLE")])
    tools = extract_phrase_matches(doc, phrase_matcher, "TOOL")
    years_of_experience = extract_years_of_experience(doc, experience_matcher)

    excluded_terms = {
        *(value.lower() for value in hard_skills),
        *(value.lower() for value in soft_skills),
        *(value.lower() for value in job_titles),
        *(value.lower() for value in tools),
    }
    role_keywords = extract_role_keywords(doc, excluded_terms)

    return JobDescriptionKeywordData(
        hard_skills=hard_skills,
        soft_skills=soft_skills,
        job_titles=[item for item in job_titles if item],
        tools=tools,
        years_of_experience=years_of_experience,
        role_keywords=role_keywords,
    )

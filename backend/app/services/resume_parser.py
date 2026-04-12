from dataclasses import asdict, dataclass
import re


SECTION_ALIASES = {
    "summary": {
        # English
        "summary",
        "professional summary",
        "profile",
        "objective",
        "career objective",
        "professional profile",
        # Arabic
        "ملخص",
        "الملخص",
        "الملخص المهني",
        "نبذة",
        "نبذة شخصية",
        "الهدف الوظيفي",
        "نبذة مختصرة",
        "المقدمة",
    },
    "skills": {
        # English
        "skills",
        "technical skills",
        "core competencies",
        "competencies",
        "strengths",
        "technologies",
        # Arabic
        "المهارات",
        "مهارات",
        "الكفاءات",
        "الكفاءات الأساسية",
        "الخبرات التقنية",
        "المهارات التقنية",
        "المهارات الفنية",
        "القدرات",
    },
    "experience": {
        # English
        "experience",
        "work experience",
        "professional experience",
        "employment history",
        "work history",
        # Arabic
        "الخبرة",
        "خبرة العمل",
        "الخبرة العملية",
        "الخبرة المهنية",
        "المسيرة المهنية",
        "تاريخ العمل",
        "الوظائف السابقة",
        "الخبرات",
    },
    "education": {
        # English
        "education",
        "academic background",
        "academic history",
        "qualifications",
        "education and training",
        # Arabic
        "التعليم",
        "المؤهلات",
        "الشهادات",
        "المؤهلات العلمية",
        "التعليم والتدريب",
        "الخلفية الأكاديمية",
        "الدراسة",
    },
}


@dataclass(frozen=True)
class StructuredResumeData:
    """Structured result produced by the rule-based resume parser."""

    name: str | None
    summary: str | None
    skills: list[str]
    experience: list[str]
    education: list[str]

    def to_dict(self) -> dict:
        """Convert the parsed result into a JSON-serializable dictionary."""
        return asdict(self)


def normalize_heading(line: str) -> str:
    """Normalize a heading line for robust section matching.

    Preserves Arabic characters while stripping punctuation and extra spaces.
    """
    lowered = line.lower().strip().rstrip(":")
    # Keep Latin alphanumerics, Arabic characters, and whitespace
    lowered = re.sub(r"[^a-z0-9\s\u0600-\u06FF\u0750-\u077F]", " ", lowered)
    return re.sub(r"\s+", " ", lowered).strip()


def is_section_heading(line: str) -> str | None:
    """Return the canonical section name when a line looks like a resume heading."""
    normalized = normalize_heading(line)

    for section, aliases in SECTION_ALIASES.items():
        if normalized in aliases:
            return section

    return None


def looks_like_name(line: str) -> bool:
    """Heuristic detection for a resume name at the top of the document."""
    stripped = line.strip()

    if not stripped or len(stripped) > 60:
        return False

    if any(token in stripped.lower() for token in ("@", "http", "www", "linkedin", "+", "phone")):
        return False

    words = stripped.split()
    if not 1 < len(words) <= 5:
        return False

    # Accept Latin names or Arabic names (Arabic Unicode block)
    return all(
        re.fullmatch(r"[A-Za-z][A-Za-z'.-]*", word)
        or re.fullmatch(r"[\u0600-\u06FF]+", word)
        for word in words
    )


def strip_list_marker(line: str) -> str:
    """Remove common ASCII list markers from a line."""
    return re.sub(r"^[-*]+\s*", "", line.strip())


def split_section_blocks(lines: list[str]) -> list[str]:
    """Group section lines into readable text blocks separated by blank lines."""
    blocks: list[str] = []
    current_block: list[str] = []

    for line in lines:
        stripped = line.strip()

        if not stripped:
            if current_block:
                blocks.append(" ".join(current_block).strip())
                current_block = []
            continue

        current_block.append(strip_list_marker(stripped))

    if current_block:
        blocks.append(" ".join(current_block).strip())

    return [block for block in blocks if block]


def parse_skills(lines: list[str]) -> list[str]:
    """Extract a normalized list of skills from a skills section."""
    skills: list[str] = []

    for line in lines:
        stripped = strip_list_marker(line)
        if not stripped:
            continue

        parts = re.split(r"[,|/]| {2,}", stripped)
        for part in parts:
            skill = part.strip()
            if skill:
                skills.append(skill)

    deduplicated: list[str] = []
    seen: set[str] = set()

    for skill in skills:
        key = skill.lower()
        if key not in seen:
            seen.add(key)
            deduplicated.append(skill)

    return deduplicated


def extract_name(lines: list[str]) -> str | None:
    """Find the most likely candidate for the resume owner's name."""
    for line in lines[:6]:
        if looks_like_name(line):
            return line.strip()

    return None


def extract_summary(section_lines: list[str], intro_lines: list[str], name: str | None) -> str | None:
    """Build a summary from an explicit summary section or the intro text."""
    summary_blocks = split_section_blocks(section_lines)
    if summary_blocks:
        return " ".join(summary_blocks)

    fallback_lines = [line.strip() for line in intro_lines if line.strip()]
    if name:
        fallback_lines = [line for line in fallback_lines if line != name]

    if fallback_lines:
        return " ".join(fallback_lines[:3]).strip()

    return None


def collect_sections(lines: list[str]) -> tuple[dict[str, list[str]], list[str]]:
    """Collect resume sections based on common heading names."""
    sections: dict[str, list[str]] = {key: [] for key in SECTION_ALIASES}
    intro_lines: list[str] = []
    current_section: str | None = None

    for line in lines:
        section_name = is_section_heading(line)

        if section_name:
            current_section = section_name
            continue

        if current_section:
            sections[current_section].append(line)
        else:
            intro_lines.append(line)

    return sections, intro_lines


def parse_resume_text(normalized_text: str) -> StructuredResumeData:
    """Parse normalized resume text into a structured rule-based JSON shape."""
    lines = [line.rstrip() for line in normalized_text.split("\n")]
    sections, intro_lines = collect_sections(lines)
    name = extract_name(intro_lines)

    return StructuredResumeData(
        name=name,
        summary=extract_summary(sections["summary"], intro_lines, name),
        skills=parse_skills(sections["skills"]),
        experience=split_section_blocks(sections["experience"]),
        education=split_section_blocks(sections["education"]),
    )

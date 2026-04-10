import re


def normalize_text_content(text: str) -> str:
    """Normalize extracted or submitted text into a predictable storage format."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    normalized_lines = [line.strip() for line in text.split("\n")]
    normalized_text = "\n".join(normalized_lines)
    return normalized_text.strip()

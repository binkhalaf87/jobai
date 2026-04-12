import re


def normalize_arabic(text: str) -> str:
    """Normalize Arabic script for consistent TF-IDF tokenization.

    Removes diacritics, unifies alef variants, normalizes ta marbuta and ya,
    and strips tatweel — all of which cause identical words to appear as
    different tokens when left unnormalized.
    """
    # Remove tashkeel (diacritics / harakat)
    text = re.sub(r"[\u064B-\u065F\u0670]", "", text)
    # Normalize alef variants → bare alef
    text = re.sub(r"[أإآٱ]", "ا", text)
    # Normalize ta marbuta → ha (improves recall between forms)
    text = re.sub(r"ة", "ه", text)
    # Normalize ya variants
    text = re.sub(r"ى", "ي", text)
    # Remove tatweel (kashida)
    text = re.sub(r"ـ", "", text)
    return text


def normalize_text_content(text: str) -> str:
    """Normalize extracted or submitted text into a predictable storage format.

    Handles both Latin and Arabic text.
    """
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = normalize_arabic(text)
    normalized_lines = [line.strip() for line in text.split("\n")]
    normalized_text = "\n".join(normalized_lines)
    return normalized_text.strip()

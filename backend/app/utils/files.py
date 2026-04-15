from pathlib import Path

# ---------------------------------------------------------------------------
# Supported types
# ---------------------------------------------------------------------------

# Map extension → set of allowed MIME types reported by the client.
_ALLOWED_CONTENT_TYPES: dict[str, set[str]] = {
    ".pdf":  {"application/pdf"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
}

# First bytes that must appear at the start of a valid file.
# PDF  → %PDF literal
# DOCX → PK\x03\x04  (ZIP local-file header — DOCX is a ZIP archive)
_MAGIC_BYTES: dict[str, bytes] = {
    ".pdf":  b"%PDF",
    ".docx": b"PK\x03\x04",
}

# Absolute upper bound for uploaded resume files.
MAX_RESUME_FILE_SIZE: int = 10 * 1024 * 1024  # 10 MB

# Keep the old name so existing imports don't break.
ALLOWED_RESUME_TYPES = _ALLOWED_CONTENT_TYPES


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def validate_resume_file(
    filename: str,
    content_type: str | None,
    file_bytes: bytes | None = None,
) -> str:
    """Validate an uploaded resume and return its normalised extension (e.g. '.pdf').

    Three layers of validation are applied when *file_bytes* is provided:

    1. **Extension** – must be .pdf or .docx.
    2. **Content-Type** – client-reported MIME is sanity-checked (not trusted
       alone because it is trivially spoofed).
    3. **Magic bytes** – the actual first bytes of the file must match the
       expected signature, blocking disguised malicious uploads.
    4. **Size** – files larger than MAX_RESUME_FILE_SIZE are rejected.

    When *file_bytes* is None only extension + content-type run (legacy path).
    """
    suffix = Path(filename).suffix.lower()

    if suffix not in _ALLOWED_CONTENT_TYPES:
        raise ValueError("Only PDF and DOCX files are supported.")

    # Content-type check (client-supplied — not authoritative on its own)
    normalised_ct = (content_type or "").lower().strip()
    if normalised_ct and normalised_ct not in _ALLOWED_CONTENT_TYPES[suffix]:
        raise ValueError("The uploaded file type does not match the expected document format.")

    if file_bytes is not None:
        # Size guard — applied before any parsing
        if len(file_bytes) > MAX_RESUME_FILE_SIZE:
            limit_mb = MAX_RESUME_FILE_SIZE // (1024 * 1024)
            raise ValueError(f"File is too large. Maximum allowed size is {limit_mb} MB.")

        # Magic-bytes guard — defends against extension / MIME spoofing
        expected_magic = _MAGIC_BYTES.get(suffix, b"")
        if expected_magic and not file_bytes.startswith(expected_magic):
            raise ValueError(
                "File content does not match its extension. "
                "Please upload a genuine PDF or DOCX file."
            )

    return suffix

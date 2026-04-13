from __future__ import annotations

from pathlib import Path

from app.core.config import get_settings


def get_resume_storage_dir() -> Path:
    """Return the durable directory used for newly uploaded resume files."""
    storage_dir = Path(get_settings().resume_storage_dir).expanduser().resolve()
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


def build_storage_key(resume_id: str, suffix: str) -> str:
    """Store a relative key so files remain portable if the base directory changes."""
    normalized_suffix = suffix.lower()
    return f"{resume_id}{normalized_suffix}"


def build_resume_file_path(resume_id: str, suffix: str) -> Path:
    """Build the on-disk path for a newly uploaded resume."""
    return get_resume_storage_dir() / build_storage_key(resume_id, suffix)


def resolve_storage_key(storage_key: str | None) -> Path | None:
    """Resolve both legacy absolute paths and new relative keys into a real file path."""
    if not storage_key:
        return None

    candidate = Path(storage_key).expanduser()
    if candidate.is_absolute():
        return candidate

    return get_resume_storage_dir() / candidate


def resume_file_exists(storage_key: str | None) -> bool:
    path = resolve_storage_key(storage_key)
    return bool(path and path.exists() and path.is_file())


def delete_resume_file(storage_key: str | None) -> None:
    """Best-effort cleanup for stored resume files."""
    path = resolve_storage_key(storage_key)
    if not path or not path.exists() or not path.is_file():
        return

    path.unlink()

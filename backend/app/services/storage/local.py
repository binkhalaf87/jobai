from __future__ import annotations

from pathlib import Path

from app.core.config import get_settings

from .base import StorageBackend


class LocalStorageBackend(StorageBackend):
    """Filesystem-based storage — suitable for local development only.

    WARNING: Data is lost when the container restarts or scales out.
    Use S3StorageBackend for any persistent deployment.
    """

    def __init__(self) -> None:
        self._base: Path = Path(get_settings().resume_storage_dir).expanduser().resolve()
        self._base.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _resolve(self, key: str) -> Path:
        """Support both legacy absolute paths and new relative storage keys."""
        candidate = Path(key)
        if candidate.is_absolute():
            return candidate
        return self._base / key

    # ------------------------------------------------------------------
    # StorageBackend interface
    # ------------------------------------------------------------------

    def upload(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
        path = self._resolve(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def delete(self, key: str) -> None:
        path = self._resolve(key)
        if path.exists() and path.is_file():
            path.unlink()

    def exists(self, key: str) -> bool:
        path = self._resolve(key)
        return path.exists() and path.is_file()

    def download(self, key: str) -> bytes:
        path = self._resolve(key)
        if not path.exists():
            raise FileNotFoundError(f"Storage key not found: {key}")
        return path.read_bytes()

    def get_download_url(self, key: str, expires_in: int = 3600) -> str | None:
        # Local storage has no URL — caller falls back to FileResponse
        return None

    def get_local_path(self, key: str) -> Path | None:
        path = self._resolve(key)
        return path if (path.exists() and path.is_file()) else None

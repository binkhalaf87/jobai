from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class StorageBackend(ABC):
    """Common interface for all storage backends (local, S3, R2, MinIO…)."""

    @abstractmethod
    def upload(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
        """Write *data* under *key*.  Raises on failure."""

    @abstractmethod
    def delete(self, key: str) -> None:
        """Best-effort removal of *key*.  Should not raise if the key is missing."""

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Return True when the object identified by *key* is present."""

    @abstractmethod
    def get_download_url(self, key: str, expires_in: int = 3600) -> str | None:
        """Return a time-limited URL the client can use to download the file.

        Cloud backends return a pre-signed URL.
        Local backend returns *None*; callers fall back to streaming via FileResponse.
        """

    @abstractmethod
    def download(self, key: str) -> bytes:
        """Return the raw bytes of the stored object.  Raises on failure."""

    @abstractmethod
    def get_local_path(self, key: str) -> Path | None:
        """Return an on-disk Path for FileResponse streaming.

        Local backend returns the resolved path.
        Cloud backends return *None*; callers should use get_download_url() instead.
        """

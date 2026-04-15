from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings

from .base import StorageBackend


@lru_cache(maxsize=1)
def get_storage() -> StorageBackend:
    """Return the appropriate storage backend based on current settings.

    - S3_BUCKET_NAME is set  →  S3StorageBackend  (production / staging)
    - S3_BUCKET_NAME is empty →  LocalStorageBackend  (local development)

    The instance is cached for the lifetime of the process.
    Call get_storage.cache_clear() in tests that need a fresh instance.
    """
    settings = get_settings()

    if settings.s3_bucket_name:
        from .s3 import S3StorageBackend
        return S3StorageBackend()

    import warnings
    warnings.warn(
        "S3_BUCKET_NAME is not configured — using local filesystem storage. "
        "Files will be lost when the container restarts. "
        "Set S3_BUCKET_NAME (and related S3_* vars) for a persistent deployment.",
        stacklevel=2,
    )
    from .local import LocalStorageBackend
    return LocalStorageBackend()

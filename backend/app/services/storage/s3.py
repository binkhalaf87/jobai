from __future__ import annotations

from pathlib import Path

from app.core.config import get_settings

from .base import StorageBackend


class S3StorageBackend(StorageBackend):
    """S3-compatible object storage backend.

    Works with AWS S3, Cloudflare R2, MinIO, and any other S3-compatible service.
    Set S3_ENDPOINT_URL to use a non-AWS provider.
    """

    def __init__(self) -> None:
        try:
            import boto3  # type: ignore[import-untyped]
            from botocore.exceptions import ClientError  # type: ignore[import-untyped]
        except ImportError as exc:
            raise RuntimeError(
                "boto3 is required for S3 storage. Run: pip install boto3"
            ) from exc

        self._ClientError = ClientError

        settings = get_settings()
        self._bucket: str = settings.s3_bucket_name  # type: ignore[assignment]

        client_kwargs: dict[str, str] = {
            "region_name": settings.s3_region or "us-east-1",
        }
        if settings.s3_access_key_id:
            client_kwargs["aws_access_key_id"] = settings.s3_access_key_id
        if settings.s3_secret_access_key:
            client_kwargs["aws_secret_access_key"] = settings.s3_secret_access_key
        if settings.s3_endpoint_url:
            client_kwargs["endpoint_url"] = settings.s3_endpoint_url

        self._client = boto3.client("s3", **client_kwargs)

    # ------------------------------------------------------------------
    # StorageBackend interface
    # ------------------------------------------------------------------

    def upload(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    def delete(self, key: str) -> None:
        try:
            self._client.delete_object(Bucket=self._bucket, Key=key)
        except self._ClientError:
            pass  # best-effort — object may already be gone

    def exists(self, key: str) -> bool:
        try:
            self._client.head_object(Bucket=self._bucket, Key=key)
            return True
        except self._ClientError:
            return False

    def download(self, key: str) -> bytes:
        response = self._client.get_object(Bucket=self._bucket, Key=key)
        return response["Body"].read()  # type: ignore[no-any-return]

    def get_download_url(self, key: str, expires_in: int = 3600) -> str | None:
        """Return a pre-signed URL valid for *expires_in* seconds."""
        return self._client.generate_presigned_url(  # type: ignore[no-any-return]
            "get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    def get_local_path(self, key: str) -> Path | None:
        # Cloud storage has no local path — caller uses get_download_url()
        return None

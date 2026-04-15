import os
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit


class MissingEnvironmentVariablesError(RuntimeError):
    """Raised when one or more required environment variables are not configured."""


def normalize_origin(origin: str) -> str:
    """Normalize a configured browser origin into `scheme://host[:port]` form."""
    candidate = origin.strip()

    if not candidate:
        return ""

    if "://" not in candidate:
        if candidate.startswith(("localhost", "127.0.0.1")):
            candidate = f"http://{candidate}"
        else:
            candidate = f"https://{candidate}"

    parsed_origin = urlsplit(candidate)

    if parsed_origin.scheme and parsed_origin.netloc:
        return f"{parsed_origin.scheme}://{parsed_origin.netloc}"

    return candidate.rstrip("/")


def build_allowed_origins(allowed_origin: str, environment: str) -> list[str]:
    """Build an explicit allowlist for frontend origins."""
    configured_origins = [
        normalized_origin
        for origin in allowed_origin.split(",")
        if (normalized_origin := normalize_origin(origin))
    ]

    if environment.lower() != "production":
        configured_origins.extend(
            [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3001",
            ]
        )

    return list(dict.fromkeys(configured_origins))


def build_allowed_origin_regex(origins: list[str]) -> str | None:
    """Allow Vercel preview deployments that belong to configured production hosts."""
    regex_patterns: list[str] = []

    for origin in origins:
        parsed_origin = urlsplit(origin)

        if parsed_origin.scheme != "https" or not parsed_origin.netloc.endswith(".vercel.app"):
            continue

        project_host = parsed_origin.netloc.removesuffix(".vercel.app")
        preview_pattern = rf"^https://{re.escape(project_host)}(?:-[a-z0-9-]+)?\.vercel\.app$"
        regex_patterns.append(preview_pattern)

    if not regex_patterns:
        return None

    return "|".join(regex_patterns)


def resolve_cors_configuration(
    allowed_origin: str | None = None,
    environment: str | None = None,
) -> tuple[list[str], str | None]:
    """Resolve CORS origins from explicit values or the current environment."""
    resolved_allowed_origin = allowed_origin if allowed_origin is not None else get_optional_env("ALLOWED_ORIGIN", "")
    resolved_environment = environment if environment is not None else get_optional_env("ENVIRONMENT", "development")
    origins = build_allowed_origins(resolved_allowed_origin, resolved_environment)
    return origins, build_allowed_origin_regex(origins)


def get_optional_env(name: str, default: str) -> str:
    """Read an environment variable and fall back to a default when it is unset."""
    return os.getenv(name, default)


def get_bool_env(name: str, default: bool) -> bool:
    """Parse a boolean environment variable from common string representations."""
    value = os.getenv(name)

    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


def get_required_env(name: str) -> str:
    """Read a required environment variable and raise a clear error when it is missing."""
    value = os.getenv(name)

    if not value:
        raise MissingEnvironmentVariablesError(
            f"Missing required backend environment variable: {name}. "
            "Add it to backend/.env or your deployment provider settings."
        )

    return value


def get_default_resume_storage_dir() -> str:
    """Use a durable local directory inside the backend project by default."""
    backend_dir = Path(__file__).resolve().parents[2]
    return str((backend_dir / "storage" / "resumes").resolve())


@dataclass(frozen=True)
class Settings:
    """Central application settings loaded from environment variables."""

    app_name: str
    app_version: str
    api_prefix: str
    environment: str
    debug: bool
    database_url: str
    openai_api_key: str | None
    openai_rewrite_model: str
    jwt_secret: str
    allowed_origin: str
    redis_url: str | None
    stripe_secret_key: str | None
    paymob_api_key: str | None
    paymob_hmac_secret: str | None
    paymob_public_key: str | None
    paymob_integration_id: str | None
    paymob_iframe_id: str | None
    rapidapi_key: str | None
    resume_storage_dir: str
    # S3-compatible object storage (AWS S3, Cloudflare R2, MinIO…)
    # Leave blank to fall back to local filesystem storage (dev only).
    s3_bucket_name: str | None
    s3_endpoint_url: str | None
    s3_region: str
    s3_access_key_id: str | None
    s3_secret_access_key: str | None

    def allowed_origins(self) -> list[str]:
        """Build an explicit allowlist for frontend origins."""
        return build_allowed_origins(self.allowed_origin, self.environment)

    def allowed_origin_regex(self) -> str | None:
        """Allow Vercel preview deployments that belong to configured production hosts."""
        return build_allowed_origin_regex(self.allowed_origins())


def build_settings() -> Settings:
    """Construct settings and report all missing required variables at once."""
    required_names = (
        "DATABASE_URL",
        "JWT_SECRET",
        "ALLOWED_ORIGIN",
    )
    missing_names = [name for name in required_names if not os.getenv(name)]

    if missing_names:
        missing_list = ", ".join(missing_names)
        raise MissingEnvironmentVariablesError(
            "Missing required backend environment variables: "
            f"{missing_list}. Add them to backend/.env or your deployment provider settings."
        )

    return Settings(
        app_name=get_optional_env("APP_NAME", "JobAI Backend"),
        app_version=get_optional_env("APP_VERSION", "0.1.0"),
        api_prefix=get_optional_env("API_PREFIX", "/api/v1"),
        environment=get_optional_env("ENVIRONMENT", "development"),
        debug=get_bool_env("DEBUG", False),
        database_url=get_required_env("DATABASE_URL"),
        openai_api_key=get_optional_env("OPENAI_API_KEY", "").strip() or None,
        openai_rewrite_model=get_optional_env("OPENAI_REWRITE_MODEL", "gpt-4o-mini"),
        jwt_secret=get_required_env("JWT_SECRET"),
        allowed_origin=get_required_env("ALLOWED_ORIGIN"),
        redis_url=get_optional_env("REDIS_URL", "").strip() or None,
        stripe_secret_key=get_optional_env("STRIPE_SECRET_KEY", "").strip() or None,
        paymob_api_key=get_optional_env("PAYMOB_API_KEY", "").strip() or None,
        paymob_hmac_secret=get_optional_env("PAYMOB_HMAC_SECRET", "").strip() or None,
        paymob_public_key=get_optional_env("PAYMOB_PUBLIC_KEY", "").strip() or None,
        paymob_integration_id=get_optional_env("PAYMOB_INTEGRATION_ID", "").strip() or None,
        paymob_iframe_id=get_optional_env("PAYMOB_IFRAME_ID", "").strip() or None,
        rapidapi_key=get_optional_env("RAPIDAPI_KEY", "").strip() or None,
        resume_storage_dir=get_optional_env("RESUME_STORAGE_DIR", get_default_resume_storage_dir()),
        s3_bucket_name=get_optional_env("S3_BUCKET_NAME", "").strip() or None,
        s3_endpoint_url=get_optional_env("S3_ENDPOINT_URL", "").strip() or None,
        s3_region=get_optional_env("S3_REGION", "us-east-1"),
        s3_access_key_id=get_optional_env("S3_ACCESS_KEY_ID", "").strip() or None,
        s3_secret_access_key=get_optional_env("S3_SECRET_ACCESS_KEY", "").strip() or None,
    )


@lru_cache
def get_settings() -> Settings:
    """Cache settings so the application reads environment configuration once per process."""
    return build_settings()

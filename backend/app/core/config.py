import os
import re
from dataclasses import dataclass
from functools import lru_cache
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

    def allowed_origins(self) -> list[str]:
        """Build an explicit allowlist for frontend origins.

        `ALLOWED_ORIGIN` should point at the deployed Vercel frontend in production.
        During local development we also allow common localhost frontend ports so a local
        Next.js app can call the Railway-hosted or local FastAPI backend.
        """
        configured_origins = [
            normalized_origin
            for origin in self.allowed_origin.split(",")
            if (normalized_origin := normalize_origin(origin))
        ]

        if self.environment.lower() != "production":
            configured_origins.extend(
                [
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    "http://localhost:3001",
                    "http://127.0.0.1:3001",
                ]
            )

        # Preserve order while removing duplicates so the final CORS list stays predictable.
        return list(dict.fromkeys(configured_origins))

    def allowed_origin_regex(self) -> str | None:
        """Allow Vercel preview deployments that belong to configured production hosts."""
        regex_patterns: list[str] = []

        for origin in self.allowed_origins():
            parsed_origin = urlsplit(origin)

            if parsed_origin.scheme != "https" or not parsed_origin.netloc.endswith(".vercel.app"):
                continue

            project_host = parsed_origin.netloc.removesuffix(".vercel.app")
            preview_pattern = (
                rf"^https://{re.escape(project_host)}(?:-[a-z0-9-]+)?\.vercel\.app$"
            )
            regex_patterns.append(preview_pattern)

        if not regex_patterns:
            return None

        return "|".join(regex_patterns)


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
    )


@lru_cache
def get_settings() -> Settings:
    """Cache settings so the application reads environment configuration once per process."""
    return build_settings()

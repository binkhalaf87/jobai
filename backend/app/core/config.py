from dataclasses import dataclass
from functools import lru_cache
import os


class MissingEnvironmentVariablesError(RuntimeError):
    """Raised when one or more required environment variables are not configured."""


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
        configured_origins = [origin.strip() for origin in self.allowed_origin.split(",") if origin.strip()]

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
        openai_rewrite_model=get_optional_env("OPENAI_REWRITE_MODEL", "gpt-5-mini"),
        jwt_secret=get_required_env("JWT_SECRET"),
        allowed_origin=get_required_env("ALLOWED_ORIGIN"),
        redis_url=get_optional_env("REDIS_URL", "").strip() or None,
        stripe_secret_key=get_optional_env("STRIPE_SECRET_KEY", "").strip() or None,
    )


@lru_cache
def get_settings() -> Settings:
    """Cache settings so the application reads environment configuration once per process."""
    return build_settings()

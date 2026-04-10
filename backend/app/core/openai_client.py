from functools import lru_cache

from openai import OpenAI

from app.core.config import get_settings


@lru_cache
def get_openai_client() -> OpenAI:
    """Create and cache the OpenAI client once per process."""
    settings = get_settings()
    return OpenAI(api_key=settings.openai_api_key)

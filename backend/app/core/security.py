from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import get_settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt for persistent storage."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str | None) -> bool:
    """Compare a plaintext password against a stored bcrypt hash."""
    if not password_hash:
        return False

    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(subject: str) -> str:
    """Create a short-lived JWT for authenticated API access."""
    settings = get_settings()
    expire_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire_at, "type": "access"}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate an access token payload."""
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])


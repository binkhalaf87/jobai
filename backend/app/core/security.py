from __future__ import annotations

import hashlib
import secrets
import threading
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import get_settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30

# In-memory blacklist for revoked access tokens, keyed by jti → expiry.
# Entries are cleaned up lazily on each write. This is intentionally simple:
# it resets on server restart (acceptable for MVP). Use Redis for persistence.
_token_blacklist: dict[str, datetime] = {}
_blacklist_lock = threading.Lock()


def blacklist_token(jti: str, exp: datetime) -> None:
    with _blacklist_lock:
        _token_blacklist[jti] = exp
        now = datetime.now(timezone.utc)
        expired = [k for k, v in _token_blacklist.items() if v < now]
        for k in expired:
            del _token_blacklist[k]


def is_token_blacklisted(jti: str) -> bool:
    with _blacklist_lock:
        return jti in _token_blacklist


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt for persistent storage."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str | None) -> bool:
    """Compare a plaintext password against a stored bcrypt hash."""
    if not password_hash:
        return False
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(subject: str, role: str = "jobseeker") -> str:
    """Create a short-lived JWT for authenticated API access."""
    settings = get_settings()
    expire_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "exp": expire_at,
        "type": "access",
        "role": role,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate an access token. Rejects refresh tokens and revoked tokens."""
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Not an access token")
    jti = payload.get("jti")
    if jti and is_token_blacklisted(jti):
        raise jwt.InvalidTokenError("Token has been revoked")
    return payload


def create_refresh_token() -> tuple[str, str]:
    """Return (raw_token, sha256_hash). Store only the hash; send raw to client."""
    raw = secrets.token_urlsafe(48)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def hash_refresh_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()

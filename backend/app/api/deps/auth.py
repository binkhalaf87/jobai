from jwt import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.core.security import decode_access_token
from app.models.user import User

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the current authenticated user from a bearer token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
    except InvalidTokenError as exc:
        raise credentials_exception from exc

    if not user_id:
        raise credentials_exception

    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise credentials_exception

    return user

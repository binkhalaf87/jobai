from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.core.rate_limit import limiter
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest
from app.schemas.user import UserCreate, UserRead
from app.services.auth import authenticate_user, build_auth_response, create_user, get_user_by_email

# This router isolates authentication endpoints from the rest of the API surface.
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)) -> dict[str, object]:
    """Create a user account and immediately return an access token."""
    existing_user = get_user_by_email(db, payload.email)

    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with that email already exists.")

    user = create_user(db, payload)
    return build_auth_response(user)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    """Authenticate a user and return a bearer token."""
    user = authenticate_user(db, payload)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    return build_auth_response(user)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    """Return the currently authenticated user."""
    return current_user

"""Lightweight page-view tracking endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.core.rate_limit import limiter
from app.models.enums import UsageEventType
from app.models.user import User
from app.services.audit_log import emit as audit_emit

router = APIRouter(prefix="/tracking", tags=["tracking"])


class PageViewRequest(BaseModel):
    path: str


@router.post("/page-view", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("60/minute")
def track_page_view(
    request: Request,
    body: PageViewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if body.path.startswith("/admin"):
        return
    audit_emit(
        db,
        user_id=current_user.id,
        event_type=UsageEventType.PAGE_VIEW,
        detail=body.path,
    )

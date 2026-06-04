"""Support ticket routes — for authenticated users."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.models.enums import TicketStatus, UsageEventType
from app.models.support_ticket import SupportTicket, TicketMessage
from app.models.user import User
from app.schemas.support_ticket import (
    MessageResponse,
    TicketCreate,
    TicketDetailResponse,
    TicketMessageCreate,
    TicketResponse,
    UnreadCountResponse,
)
from app.services import support_ticket_service as svc
from app.services.audit_log import emit as audit_emit

router = APIRouter(prefix="/support", tags=["support"])


def _ticket_response(db: Session, ticket: SupportTicket) -> TicketResponse:
    msg_count = db.scalar(
        select(func.count()).select_from(TicketMessage).where(TicketMessage.ticket_id == ticket.id)
    ) or 0
    return TicketResponse(
        id=ticket.id,
        category=ticket.category,
        subject=ticket.subject,
        status=ticket.status,
        unread_by_user=ticket.unread_by_user,
        unread_by_admin=ticket.unread_by_admin,
        message_count=msg_count,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


def _message_response(msg: TicketMessage) -> MessageResponse:
    sender_name = msg.sender.full_name if msg.sender else None
    return MessageResponse(
        id=msg.id,
        body=msg.body,
        is_admin_message=msg.is_admin_message,
        sender_name=sender_name,
        created_at=msg.created_at,
    )


@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    data: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TicketResponse:
    ticket = svc.create_ticket(db, current_user.id, data)
    audit_emit(db, user_id=current_user.id, event_type=UsageEventType.TICKET_CREATED, detail=f"ticket={ticket.id}")
    return _ticket_response(db, ticket)


@router.get("/tickets", response_model=list[TicketResponse])
def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TicketResponse]:
    offset = (page - 1) * page_size
    tickets = db.scalars(
        select(SupportTicket)
        .where(SupportTicket.user_id == current_user.id)
        .order_by(SupportTicket.updated_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()
    return [_ticket_response(db, t) for t in tickets]


@router.get("/tickets/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TicketDetailResponse:
    ticket = db.get(SupportTicket, ticket_id)
    if not ticket or ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    svc.mark_ticket_read(db, ticket, by_admin=False)

    return TicketDetailResponse(
        id=ticket.id,
        category=ticket.category,
        subject=ticket.subject,
        status=ticket.status,
        unread_by_user=ticket.unread_by_user,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        messages=[_message_response(m) for m in ticket.messages],
    )


@router.post("/tickets/{ticket_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    ticket_id: str,
    data: TicketMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    ticket = db.get(SupportTicket, ticket_id)
    if not ticket or ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")
    if ticket.status == TicketStatus.CLOSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot reply to a closed ticket.")

    msg = svc.add_message(db, ticket, sender_id=current_user.id, body=data.body, is_admin=False)
    audit_emit(db, user_id=current_user.id, event_type=UsageEventType.TICKET_MESSAGE_SENT, detail=f"ticket={ticket_id}")
    return _message_response(msg)


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UnreadCountResponse:
    count = svc.get_user_unread_count(db, current_user.id)
    return UnreadCountResponse(count=count)


@router.post("/tickets/{ticket_id}/read", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def mark_read(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    ticket = db.get(SupportTicket, ticket_id)
    if not ticket or ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")
    svc.mark_ticket_read(db, ticket, by_admin=False)

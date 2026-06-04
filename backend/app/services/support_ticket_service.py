"""Business logic for support tickets."""

from __future__ import annotations

import logging

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.support_ticket import SupportTicket, TicketMessage
from app.models.user import User
from app.schemas.support_ticket import TicketCreate

logger = logging.getLogger(__name__)


def create_ticket(db: Session, user_id: str, data: TicketCreate) -> SupportTicket:
    ticket = SupportTicket(
        user_id=user_id,
        category=data.category,
        subject=data.subject,
        unread_by_admin=True,
        unread_by_user=False,
    )
    db.add(ticket)
    db.flush()

    message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=user_id,
        body=data.body,
        is_admin_message=False,
    )
    db.add(message)
    db.commit()
    db.refresh(ticket)
    return ticket


def add_message(
    db: Session,
    ticket: SupportTicket,
    sender_id: str,
    body: str,
    is_admin: bool,
) -> TicketMessage:
    message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=sender_id,
        body=body,
        is_admin_message=is_admin,
    )
    db.add(message)

    if is_admin:
        ticket.unread_by_user = True
    else:
        ticket.unread_by_admin = True

    db.commit()
    db.refresh(message)

    if is_admin:
        _notify_user_by_email(db, ticket, body)

    return message


def mark_ticket_read(db: Session, ticket: SupportTicket, by_admin: bool) -> None:
    if by_admin:
        ticket.unread_by_admin = False
    else:
        ticket.unread_by_user = False
    db.commit()


def get_user_unread_count(db: Session, user_id: str) -> int:
    return db.scalar(
        select(func.count()).select_from(SupportTicket)
        .where(SupportTicket.user_id == user_id, SupportTicket.unread_by_user.is_(True))
    ) or 0


def get_admin_unread_count(db: Session) -> int:
    return db.scalar(
        select(func.count()).select_from(SupportTicket)
        .where(SupportTicket.unread_by_admin.is_(True))
    ) or 0


def _notify_user_by_email(db: Session, ticket: SupportTicket, reply_body: str) -> None:
    try:
        from app.core.config import get_settings
        from app.services.email_service import send_ticket_reply_email

        user = db.get(User, ticket.user_id)
        if not user:
            return

        settings = get_settings()
        ticket_url = f"{settings.frontend_url}/dashboard/support/{ticket.id}"
        send_ticket_reply_email(
            to_email=user.email,
            name=user.full_name,
            ticket_subject=ticket.subject,
            admin_reply_body=reply_body,
            ticket_url=ticket_url,
        )
    except Exception:
        logger.exception("Failed to send ticket reply email for ticket %s", ticket.id)

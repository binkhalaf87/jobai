import logging

from app.core.application import create_unavailable_application

logger = logging.getLogger(__name__)

try:
    from app.main import create_application

    app = create_application()
except Exception as exc:
    logger.exception("JobAI backend failed to initialize.")
    app = create_unavailable_application(exc)

# This module exposes the ASGI application at the backend root so deployment commands can use `main:app`.

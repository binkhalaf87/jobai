import logging

from app.core.application import create_unavailable_application

logger = logging.getLogger(__name__)

try:
    from app.main import create_application

    app = create_application()
except Exception as exc:
    import traceback
    print("STARTUP FAILURE:", exc, flush=True)
    print(traceback.format_exc(), flush=True)
    logger.exception("JobAI backend failed to initialize.")
    app = create_unavailable_application(exc)

# This module exposes the ASGI application at the backend root so deployment commands can use `main:app`.

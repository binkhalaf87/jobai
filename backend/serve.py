from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

import uvicorn
from alembic import command
from alembic.config import Config as AlembicConfig

from app.core.application import create_unavailable_application

PROJECT_ROOT = Path(__file__).resolve().parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

os.chdir(PROJECT_ROOT)

logger = logging.getLogger("jobai.bootstrap")


def run_database_migrations() -> None:
    """Run Alembic migrations from the copied backend root inside the container."""
    alembic_config = AlembicConfig(str(PROJECT_ROOT / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(PROJECT_ROOT / "alembic"))
    alembic_config.set_main_option("prepend_sys_path", str(PROJECT_ROOT))
    command.upgrade(alembic_config, "head")


def build_application():
    """Boot the live backend, or a CORS-enabled fallback app when startup fails."""
    try:
        run_database_migrations()
        from main import app as application

        return application
    except Exception as exc:
        logger.exception("Backend startup failed before serving traffic.")
        return create_unavailable_application(exc)


if __name__ == "__main__":
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
    uvicorn.run(build_application(), host="0.0.0.0", port=int(os.getenv("PORT", "8000")))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
# pool_size      – persistent connections kept open between requests.
# max_overflow   – extra connections allowed during traffic spikes (released
#                  once the spike passes); total ceiling = pool_size + max_overflow.
# pool_timeout   – seconds to wait for a connection before raising; prevents
#                  silent request hangs under load.
# pool_recycle   – force-replace connections older than this many seconds so
#                  the database server's idle-connection timeouts don't surprise us.
# pool_pre_ping  – issue a lightweight SELECT 1 before handing a connection to
#                  the app; protects against stale connections after DB restarts.
engine = create_engine(
    get_settings().database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,
)

# Route handlers and services can request a session from this configured factory.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=Session)


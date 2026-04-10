from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

# This engine factory is configured for PostgreSQL-backed deployments.
engine = create_engine(get_settings().database_url, pool_pre_ping=True)

# Route handlers and services can request a session from this configured factory.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=Session)


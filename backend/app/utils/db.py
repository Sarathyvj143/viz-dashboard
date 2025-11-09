from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
import os

# Create SQLite engine
engine = create_engine(
    f"sqlite:///./{settings.SQLITE_PATH}",
    connect_args={"check_same_thread": False},  # Allow multi-threading
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# NOTE: Database dependency for FastAPI routes has been moved to app.api.dependencies
# Import it from there: from app.api.dependencies import get_db

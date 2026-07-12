"""
Database configuration and session management for the Todo application.
Uses SQLite as a local, file-based database.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# SQLite database file stored in the project root
SQLALCHEMY_DATABASE_URL = "sqlite:///./todos.db"

# check_same_thread=False is required for SQLite with FastAPI's async workers
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# Session factory for creating database sessions per request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    pass


def get_db():
    """
    Dependency that provides a database session and ensures it is closed
    after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all database tables if they do not already exist."""
    Base.metadata.create_all(bind=engine)

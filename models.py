"""
SQLAlchemy ORM model representing a Todo item in the database.
"""

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Todo(Base):
    """Todo table schema: id, content, and completion status."""

    __tablename__ = "todos"

    # Primary key — auto-incremented integer
    todo_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True
    )

    # Task description text
    content: Mapped[str] = mapped_column(String, nullable=False)

    # Completion flag; defaults to False for new todos
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

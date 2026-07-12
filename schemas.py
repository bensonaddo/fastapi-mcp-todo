"""
Pydantic schemas for request validation and API response serialization.
"""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TodoBase(BaseModel):
    """Shared fields common to todo representations."""

    content: str = Field(..., min_length=1, description="The todo task description")
    completed: bool = Field(default=False, description="Whether the todo is done")


class TodoCreate(BaseModel):
    """Schema for creating a new todo (content only; completed defaults to False)."""

    content: str = Field(..., min_length=1, description="The todo task description")


class TodoUpdate(BaseModel):
    """Schema for updating an existing todo; all fields are optional."""

    content: Optional[str] = Field(
        default=None, min_length=1, description="Updated task description"
    )
    completed: Optional[bool] = Field(
        default=None, description="Updated completion status"
    )


class TodoResponse(TodoBase):
    """Schema returned by the API for a single todo item."""

    todo_id: int = Field(..., description="Unique identifier for the todo")

    model_config = ConfigDict(from_attributes=True)

"""
FastAPI Todo List Application
A simple CRUD API for managing todo items backed by a local SQLite database.
"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, init_db
from models import Todo
from schemas import TodoCreate, TodoResponse, TodoUpdate

# Import FastAPIMCP
from fastapi_mcp import FastApiMCP


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database on application startup."""
    init_db()
    yield


app = FastAPI(
    title="Todo API",
    description="A simple ToDo list management API with SQLite persistence.",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Root route
# ---------------------------------------------------------------------------


@app.get("/", tags=["Root"])
async def read_root() -> dict[str, str]:
    """Return a welcome message for the API."""
    return {"message": "Welcome to the Todo API"}


# ---------------------------------------------------------------------------
# CRUD routes
# ---------------------------------------------------------------------------


@app.get("/todos", response_model=list[TodoResponse], tags=["Todos"], operation_id="get_all_todos")
async def get_all_todos(db: Session = Depends(get_db)) -> list[Todo]:
    """Retrieve all todo items."""
    return db.query(Todo).order_by(Todo.todo_id).all()


@app.get(
    "/todos/{todo_id}",
    response_model=TodoResponse,
    tags=["Todos"],
    operation_id="get_todo",
)
async def get_todo(todo_id: int, db: Session = Depends(get_db)) -> Todo:
    """Retrieve a single todo item by its ID."""
    todo = db.query(Todo).filter(Todo.todo_id == todo_id).first()
    if todo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Todo with id {todo_id} not found",
        )
    return todo


@app.post(
    "/todos",
    response_model=TodoResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Todos"],
    operation_id="create_todo",
)
async def create_todo(todo_in: TodoCreate, db: Session = Depends(get_db)) -> Todo:
    """Add a new todo item."""
    todo = Todo(content=todo_in.content, completed=False)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@app.put(
    "/todos/{todo_id}",
    response_model=TodoResponse,
    tags=["Todos"],
    operation_id="update_todo",
)
async def update_todo(
    todo_id: int,
    todo_in: TodoUpdate,
    db: Session = Depends(get_db),
) -> Todo:
    """Update an existing todo item's content and/or completion status."""
    todo = db.query(Todo).filter(Todo.todo_id == todo_id).first()
    if todo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Todo with id {todo_id} not found",
        )

    # Apply only the fields provided in the request body
    update_data = todo_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(todo, field, value)

    db.commit()
    db.refresh(todo)
    return todo


@app.delete(
    "/todos/{todo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Todos"],
    operation_id="delete_todo",
)
async def delete_todo(todo_id: int, db: Session = Depends(get_db)) -> None:
    """Delete a todo item by its ID."""
    todo = db.query(Todo).filter(Todo.todo_id == todo_id).first()
    if todo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Todo with id {todo_id} not found",
        )

    db.delete(todo)
    db.commit()


# if __name__ == "__main__":
#     import uvicorn

#     # Create MCP server
#     mcp = FastApiMCP(app, include_operations=["get_all_todos", "get_todo", "create_todo", "update_todo", "delete_todo"])

#     # Register the MCP server with the app
#     mcp.mount()

#     # Run the app using uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)

# Create MCP server
mcp = FastApiMCP(app, include_operations=["get_all_todos", "get_todo", "create_todo", "update_todo", "delete_todo"])

# Register the MCP server with the app
mcp.mount()
# Todo Manager — FastAPI + MCP

A full-stack todo list application built with **FastAPI**, **SQLite**, and **fastapi-mcp**. It provides a REST API for CRUD operations, an interactive web UI, auto-generated OpenAPI documentation, and MCP tool exposure for AI assistants (e.g. Cursor).

**Live demo:** [https://fastapi-mcp-todo-ykjl.onrender.com](https://fastapi-mcp-todo-ykjl.onrender.com)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [Web UI](#web-ui)
- [API Reference](#api-reference)
- [OpenAPI / Swagger Documentation](#openapi--swagger-documentation)
- [Data Models](#data-models)
- [MCP Integration](#mcp-integration)
- [Deployment](#deployment)
- [External Resources](#external-resources)

---

## Features

- **REST API** — Full CRUD for todo items with typed request/response schemas
- **Web frontend** — Responsive grid UI with add, edit, complete, delete, and filter actions
- **SQLite persistence** — Local file-based database (`todos.db`)
- **OpenAPI docs** — Interactive Swagger UI and ReDoc generated automatically by FastAPI
- **MCP server** — Exposes API operations as tools for AI clients via [fastapi-mcp](https://github.com/tadata-org/fastapi_mcp)
- **Production-ready** — Deployable to Render with a single `render.yaml` blueprint

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Backend      | FastAPI, Uvicorn                    |
| ORM / DB     | SQLAlchemy, SQLite                  |
| Validation   | Pydantic v2                         |
| Frontend     | HTML, CSS, vanilla JavaScript       |
| AI Tools     | fastapi-mcp, MCP                    |
| Deployment   | Render (Python web service)         |

---

## Project Structure

```
fastapi-mcp-todo/
├── main.py              # FastAPI app, routes, MCP mount
├── database.py          # SQLite engine, session, init
├── models.py            # SQLAlchemy Todo ORM model
├── schemas.py           # Pydantic request/response schemas
├── static/
│   ├── index.html       # Frontend shell
│   ├── css/style.css    # UI styles
│   └── js/app.js        # Client-side CRUD logic
├── requirements.txt     # Python dependencies
├── render.yaml          # Render deployment config
├── todos.db             # SQLite database (created at runtime, gitignored)
└── readme.md
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- `pip` (or `uv`)

### Installation

```bash
# Clone the repository and enter the project directory
cd fastapi-mcp-todo

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt
```

---

## Running the Application

### Development (with auto-reload)

```bash
# Option A — FastAPI CLI
fastapi dev main.py

# Option B — Uvicorn directly
uvicorn main:app --reload
```

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The app starts on **http://127.0.0.1:8000** by default. The SQLite database and tables are created automatically on first startup.

---

## Web UI

| URL (local)              | Description                          |
| ------------------------ | ------------------------------------ |
| http://127.0.0.1:8000/   | Todo Manager web interface           |
| http://127.0.0.1:8000/static/ | Static assets (CSS, JS)         |

The frontend communicates with the `/todos` API and supports:

- Adding todos (instant grid update)
- Marking todos complete / incomplete
- Editing todo content (modal)
- Deleting todos (with confirmation)
- Filtering by All / Active / Completed
- Live stats (total, active, completed)

---

## API Reference

Base URL (local): `http://127.0.0.1:8000`  
Base URL (production): `https://fastapi-mcp-todo-ykjl.onrender.com`

All todo endpoints are tagged **Todos** in OpenAPI. Responses use `application/json`.

### Endpoints Summary

| Method | Path               | Operation ID     | Description              | Success |
| ------ | ------------------ | ---------------- | ------------------------ | ------- |
| `GET`  | `/todos`           | `get_all_todos`  | List all todos           | `200`   |
| `GET`  | `/todos/{todo_id}` | `get_todo`       | Get one todo by ID       | `200`   |
| `POST` | `/todos`           | `create_todo`    | Create a new todo        | `201`   |
| `PUT`  | `/todos/{todo_id}` | `update_todo`    | Update a todo            | `200`   |
| `DELETE` | `/todos/{todo_id}` | `delete_todo`  | Delete a todo            | `204`   |

---

### `GET /todos` — List all todos

Returns every todo ordered by `todo_id`.

**Response `200`**

```json
[
  {
    "todo_id": 1,
    "content": "Buy groceries",
    "completed": false
  },
  {
    "todo_id": 2,
    "content": "Schedule dentist appointment",
    "completed": true
  }
]
```

**Example**

```bash
curl http://127.0.0.1:8000/todos
```

---

### `GET /todos/{todo_id}` — Get a single todo

**Path parameters**

| Name      | Type    | Description        |
| --------- | ------- | ------------------ |
| `todo_id` | integer | Unique todo ID     |

**Response `200`**

```json
{
  "todo_id": 1,
  "content": "Buy groceries",
  "completed": false
}
```

**Response `404`** — Todo not found

```json
{
  "detail": "Todo with id 99 not found"
}
```

**Example**

```bash
curl http://127.0.0.1:8000/todos/1
```

---

### `POST /todos` — Create a todo

**Request body**

```json
{
  "content": "Finish reading chapter 5"
}
```

| Field     | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| `content` | string | yes      | Task description (min length: 1)     |

`completed` defaults to `false` and cannot be set on create.

**Response `201`**

```json
{
  "todo_id": 3,
  "content": "Finish reading chapter 5",
  "completed": false
}
```

**Example**

```bash
curl -X POST http://127.0.0.1:8000/todos \
  -H "Content-Type: application/json" \
  -d '{"content": "Finish reading chapter 5"}'
```

---

### `PUT /todos/{todo_id}` — Update a todo

Partial updates are supported — include only the fields you want to change.

**Request body** (all fields optional)

```json
{
  "content": "Updated task text",
  "completed": true
}
```

| Field       | Type    | Required | Description              |
| ----------- | ------- | -------- | ------------------------ |
| `content`   | string  | no       | Updated description      |
| `completed` | boolean | no       | Updated completion state |

**Response `200`**

```json
{
  "todo_id": 1,
  "content": "Updated task text",
  "completed": true
}
```

**Response `404`** — Todo not found

**Example**

```bash
curl -X PUT http://127.0.0.1:8000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

---

### `DELETE /todos/{todo_id}` — Delete a todo

**Response `204`** — No content (success)

**Response `404`** — Todo not found

**Example**

```bash
curl -X DELETE http://127.0.0.1:8000/todos/1
```

---

## OpenAPI / Swagger Documentation

FastAPI auto-generates interactive API documentation from route decorators, type hints, and Pydantic schemas.

### Local

| Documentation | URL |
| ------------- | --- |
| **Swagger UI** | http://127.0.0.1:8000/docs |
| **ReDoc**      | http://127.0.0.1:8000/redoc |
| **OpenAPI JSON** | http://127.0.0.1:8000/openapi.json |

### Production

| Documentation | URL |
| ------------- | --- |
| **Swagger UI** | https://fastapi-mcp-todo-ykjl.onrender.com/docs |
| **ReDoc**      | https://fastapi-mcp-todo-ykjl.onrender.com/redoc |
| **OpenAPI JSON** | https://fastapi-mcp-todo-ykjl.onrender.com/openapi.json |

Use **Swagger UI** (`/docs`) to explore endpoints, view schemas, and send test requests directly from the browser.

---

## Data Models

### Todo (database)

| Column      | Type    | Constraints              |
| ----------- | ------- | ------------------------ |
| `todo_id`   | integer | Primary key, auto-increment |
| `content`   | string  | Not null                 |
| `completed` | boolean | Not null, default `false` |

### Pydantic schemas

| Schema         | Purpose                                      |
| -------------- | -------------------------------------------- |
| `TodoCreate`   | Request body for `POST /todos`               |
| `TodoUpdate`   | Request body for `PUT /todos/{todo_id}`     |
| `TodoResponse` | Response body for all todo read/write ops    |

---

## MCP Integration

This app exposes selected API operations as **MCP tools** using [fastapi-mcp](https://github.com/tadata-org/fastapi_mcp), allowing AI assistants to manage todos programmatically.

### Exposed tools

| MCP Tool         | Maps to API endpoint   |
| ---------------- | ---------------------- |
| `get_all_todos`  | `GET /todos`           |
| `get_todo`       | `GET /todos/{todo_id}` |
| `create_todo`    | `POST /todos`          |
| `update_todo`    | `PUT /todos/{todo_id}` |
| `delete_todo`    | `DELETE /todos/{todo_id}` |

Tools are registered via `operation_id` on each route and mounted at **`/mcp`**.

### Setup in `main.py`

```python
from fastapi_mcp import FastApiMCP

mcp = FastApiMCP(
    app,
    include_operations=[
        "get_all_todos",
        "get_todo",
        "create_todo",
        "update_todo",
        "delete_todo",
    ],
)
mcp.mount()
```

### Connect from Cursor

1. Open **Cursor Settings → Tools & MCP → Add MCP Server**
2. Add the following to your MCP configuration:

```json
{
  "fastapi-mcp-todo": {
    "url": "http://127.0.0.1:8000/mcp"
  }
}
```

For the deployed app, replace the URL with:

```json
{
  "fastapi-mcp-todo": {
    "url": "https://fastapi-mcp-todo-ykjl.onrender.com/mcp"
  }
}
```

3. Restart Cursor if needed, then use natural language prompts such as:
   - *"List all todos"*
   - *"Add a todo to call mum today"*
   - *"Mark todo 2 as completed"*

---

## Deployment

The project includes a [Render](https://render.com) blueprint (`render.yaml`):

```yaml
services:
  - type: web
    name: fastapi-mcp-todo
    env: python
    buildCommand: uv pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port 8000
    plan: free
```

> **Note:** On Render's free tier, the filesystem is ephemeral. SQLite data may reset on redeploy or spin-down. For persistent production storage, consider an external database (e.g. PostgreSQL).

---

## External Resources

- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [FastAPI devdocs](https://devdocs.io/fastapi)
- [fastapi-mcp on GitHub](https://github.com/tadata-org/fastapi_mcp)
- [SQLAlchemy documentation](https://docs.sqlalchemy.org/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)

---

## License

This project is for learning and demonstration purposes.

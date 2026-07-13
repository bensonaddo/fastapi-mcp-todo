"""
Smoke tests for the Todo API — exercised by CI on every push.
Uses a throwaway SQLite file so tests never touch a real database.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/test_todos.db")
    # Force re-import so database.py picks up the test DATABASE_URL
    for mod in ("main", "models", "database"):
        sys.modules.pop(mod, None)
    from fastapi.testclient import TestClient

    from main import app

    with TestClient(app) as c:
        yield c


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_ready(client):
    resp = client.get("/ready")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ready"}


def test_root_serves_frontend(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]


def test_crud_lifecycle(client):
    # Create
    resp = client.post("/todos", json={"content": "buy milk"})
    assert resp.status_code == 201
    todo = resp.json()
    todo_id = todo["todo_id"]
    assert todo["content"] == "buy milk"
    assert todo["completed"] is False

    # Read all
    resp = client.get("/todos")
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # Read one
    resp = client.get(f"/todos/{todo_id}")
    assert resp.status_code == 200

    # Update
    resp = client.put(f"/todos/{todo_id}", json={"completed": True})
    assert resp.status_code == 200
    assert resp.json()["completed"] is True

    # Delete
    resp = client.delete(f"/todos/{todo_id}")
    assert resp.status_code == 204

    # Gone
    resp = client.get(f"/todos/{todo_id}")
    assert resp.status_code == 404


def test_get_missing_todo_returns_404(client):
    resp = client.get("/todos/99999")
    assert resp.status_code == 404

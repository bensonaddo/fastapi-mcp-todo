/**
 * Todo Manager — frontend CRUD client
 * Communicates with the FastAPI /todos endpoints.
 */

const API_BASE = "/todos";

/** @type {Array<{todo_id: number, content: string, completed: boolean}>} */
let todos = [];
let currentFilter = "all";
let editingTodoId = null;

// DOM references
const grid = document.getElementById("todo-grid");
const emptyState = document.getElementById("empty-state");
const addForm = document.getElementById("add-form");
const todoInput = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const refreshBtn = document.getElementById("refresh-btn");
const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editInput = document.getElementById("edit-input");
const editCancel = document.getElementById("edit-cancel");
const toastContainer = document.getElementById("toast-container");

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!response.ok) {
    let detail = "Something went wrong";
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  if (response.status === 204) return null;
  return response.json();
}

async function fetchTodos() {
  return apiRequest(API_BASE);
}

async function createTodo(content) {
  return apiRequest(API_BASE, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

async function updateTodo(todoId, data) {
  return apiRequest(`${API_BASE}/${todoId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deleteTodo(todoId) {
  return apiRequest(`${API_BASE}/${todoId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function setLoading(isLoading) {
  addBtn.disabled = isLoading;
  refreshBtn.disabled = isLoading;
}

function updateStats() {
  const total = todos.length;
  const done = todos.filter((t) => t.completed).length;
  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-active").textContent = total - done;
  document.getElementById("stat-done").textContent = done;
}

function getFilteredTodos() {
  if (currentFilter === "active") return todos.filter((t) => !t.completed);
  if (currentFilter === "completed") return todos.filter((t) => t.completed);
  return todos;
}

function renderSkeleton() {
  grid.innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton"></div>').join("");
  emptyState.hidden = true;
}

function renderGrid() {
  const filtered = getFilteredTodos();
  updateStats();

  if (filtered.length === 0) {
    grid.innerHTML = "";
    emptyState.hidden = todos.length > 0;
    if (todos.length > 0) {
      emptyState.querySelector("h2").textContent = "No matching todos";
      emptyState.querySelector("p").textContent =
        `No ${currentFilter} tasks found. Try a different filter.`;
    } else {
      emptyState.querySelector("h2").textContent = "No todos yet";
      emptyState.querySelector("p").textContent = "Add your first task above to get started.";
    }
    return;
  }

  emptyState.hidden = true;
  grid.innerHTML = filtered
    .map(
      (todo) => `
    <article class="todo-card ${todo.completed ? "todo-card--completed" : ""}" data-id="${todo.todo_id}">
      <div class="todo-card__header">
        <span class="todo-card__id">#${todo.todo_id}</span>
        <span class="badge ${todo.completed ? "badge--done" : "badge--active"}">
          ${todo.completed ? "Completed" : "Active"}
        </span>
      </div>
      <p class="todo-card__content">${escapeHtml(todo.content)}</p>
      <div class="todo-card__actions">
        <button type="button" class="btn btn--success btn--icon toggle-btn" data-id="${todo.todo_id}" aria-label="${todo.completed ? "Mark incomplete" : "Mark complete"}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            ${todo.completed
              ? '<path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'
              : '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>'}
          </svg>
          ${todo.completed ? "Undo" : "Done"}
        </button>
        <button type="button" class="btn btn--ghost btn--icon edit-btn" data-id="${todo.todo_id}" aria-label="Edit todo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
        <button type="button" class="btn btn--danger btn--icon delete-btn" data-id="${todo.todo_id}" aria-label="Delete todo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
          Delete
        </button>
      </div>
    </article>`
    )
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function loadTodos() {
  renderSkeleton();
  try {
    todos = await fetchTodos();
    renderGrid();
  } catch (err) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = "Failed to load todos";
    emptyState.querySelector("p").textContent = err.message;
    showToast(err.message, "error");
  }
}

async function handleAdd(e) {
  e.preventDefault();
  const content = todoInput.value.trim();
  if (!content) return;

  setLoading(true);
  try {
    const newTodo = await createTodo(content);
    todos.push(newTodo);
    todoInput.value = "";
    renderGrid();
    showToast("Todo added successfully");

    // Scroll new card into view
    requestAnimationFrame(() => {
      const card = grid.querySelector(`[data-id="${newTodo.todo_id}"]`);
      card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
    todoInput.focus();
  }
}

async function handleToggle(todoId) {
  const todo = todos.find((t) => t.todo_id === todoId);
  if (!todo) return;

  try {
    const updated = await updateTodo(todoId, { completed: !todo.completed });
    todos = todos.map((t) => (t.todo_id === todoId ? updated : t));
    renderGrid();
    showToast(updated.completed ? "Marked as complete" : "Marked as active");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function openEditModal(todoId) {
  const todo = todos.find((t) => t.todo_id === todoId);
  if (!todo) return;
  editingTodoId = todoId;
  editInput.value = todo.content;
  editModal.showModal();
  editInput.focus();
}

async function handleEditSave(e) {
  e.preventDefault();
  const content = editInput.value.trim();
  if (!content || editingTodoId === null) return;

  try {
    const updated = await updateTodo(editingTodoId, { content });
    todos = todos.map((t) => (t.todo_id === editingTodoId ? updated : t));
    editModal.close();
    editingTodoId = null;
    renderGrid();
    showToast("Todo updated successfully");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleDelete(todoId) {
  const todo = todos.find((t) => t.todo_id === todoId);
  if (!todo) return;

  const confirmed = window.confirm(`Delete "${todo.content}"?`);
  if (!confirmed) return;

  try {
    await deleteTodo(todoId);
    todos = todos.filter((t) => t.todo_id !== todoId);
    renderGrid();
    showToast("Todo deleted");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------

addForm.addEventListener("submit", handleAdd);
refreshBtn.addEventListener("click", loadTodos);
editForm.addEventListener("submit", handleEditSave);
editCancel.addEventListener("click", () => {
  editingTodoId = null;
  editModal.close();
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("filter-btn--active"));
    btn.classList.add("filter-btn--active");
    currentFilter = btn.dataset.filter;
    renderGrid();
  });
});

grid.addEventListener("click", (e) => {
  const target = e.target.closest("button");
  if (!target) return;
  const id = Number(target.dataset.id);

  if (target.classList.contains("toggle-btn")) handleToggle(id);
  if (target.classList.contains("edit-btn")) openEditModal(id);
  if (target.classList.contains("delete-btn")) handleDelete(id);
});

// Initial load
loadTodos();

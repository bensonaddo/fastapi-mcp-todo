# Development workflow

## Branching model

Trunk-based development with short-lived branches:

```
main ──────●────●────●────●──── (always deployable; auto-deploys to staging)
            \feat/x  \fix/y
             ●──●     ●
```

- `main` is protected: PRs only, CI must pass, at least one review.
- Branch names: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`.
- Releases are annotated git tags `vMAJOR.MINOR.PATCH` cut from `main`;
  tagging triggers the production pipeline (with a manual approval gate).

## Local development

```bash
# 1. Virtualenv + deps (runtime + dev tools)
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt

# 2. Run with hot reload (SQLite, zero config)
uvicorn main:app --reload

# 3. Or run the production-like stack (Postgres-backed)
docker compose up --build
# add monitoring:  docker compose --profile monitoring up --build
```

App: http://localhost:8000 · API docs: /docs · Health: /health · Metrics: /metrics

## Before you push

```bash
ruff check .          # lint — CI runs exactly this
pytest tests/ -v      # smoke tests — CI runs exactly this
```

Optional pre-commit hook:

```bash
printf '%s\n' '#!/bin/sh' 'ruff check . && pytest tests/ -q' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Pull request flow

1. Branch from `main`, keep the diff focused.
2. Open a PR — CI runs lint + tests + a docker build (image is not pushed).
3. Review + green CI → squash-merge to `main`.
4. Merge auto-deploys to **staging**; verify there.
5. When staging is healthy, cut a release:

```bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

6. Approve the production deployment in the pipeline UI (GitHub environment
   approval or Azure DevOps environment check).

## Database changes

The app currently creates tables via `init_db()` on startup, which is fine for
additive changes. Before the schema evolves beyond that, adopt Alembic:
migrations in `migrations/`, applied as a step before rollout (K8s Job or
pipeline step), never automatically at pod startup with multiple replicas.

## Versioning the MCP surface

MCP tools are generated from route `operation_id`s (`get_all_todos`,
`get_todo`, `create_todo`, `update_todo`, `delete_todo`). Renaming an
operation_id is a **breaking change** for MCP clients — treat it like an API
version bump.

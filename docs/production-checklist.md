# Production deployment checklist

Work top to bottom; nothing ships until every ☐ in "Blocking" is checked.

## Blocking — must be done before go-live

### Application
- [x] `DATABASE_URL` read from environment (PostgreSQL in prod; `postgres://` normalized)
- [x] `/health` (liveness) and `/ready` (DB-checked readiness) endpoints
- [x] `/metrics` Prometheus endpoint
- [x] Smoke tests in `tests/` wired into CI
- [ ] **Authentication on write endpoints and `/mcp`** — the API and MCP server
      are currently unauthenticated; anyone can read/write todos. Add at least
      an API key or OAuth (fastapi-mcp supports auth passthrough) before public exposure
- [ ] Rate limiting at the ingress (e.g. `nginx.ingress.kubernetes.io/limit-rps`)
- [ ] CORS policy reviewed (currently same-origin only — fine as is)

### Data
- [ ] Managed PostgreSQL provisioned (Terraform), private network only
- [ ] Automated backups on (14 days prod) and **restore actually tested once**
- [ ] Multi-AZ / zone-redundant HA enabled for production
- [ ] Migration strategy decided (Alembic) before first schema change

### Infrastructure
- [ ] Terraform state in remote backend with locking (S3+DynamoDB / azurerm)
- [ ] `ghcr.io/OWNER`, `*.example.com`, and Terraform state-backend placeholders
      replaced everywhere — each folder's README lists its own:
      [k8s/](../k8s/README.md) · [terraform/](../terraform/README.md) ·
      [ansible/](../ansible/README.md) · [.github/workflows/](../.github/workflows/README.md)
- [ ] TLS via cert-manager; HTTP→HTTPS redirect on ingress
- [ ] Secrets in cloud secret manager, synced via External Secrets (no secrets in git — verify with a scan)
- [ ] Kubeconfigs used by CI are namespace-scoped service accounts, not cluster-admin

### Pipeline
- [ ] `production` environment approval gate configured (GitHub or Azure DevOps)
- [ ] Trivy gate green (no unfixed CRITICAL/HIGH)
- [ ] Staging deploy + smoke test passing on `main`
- [ ] Rollback rehearsed once (`kubectl rollout undo`)

### Observability
- [ ] Prometheus scraping pods; alerts loaded; Alertmanager routes to a paged channel
- [ ] Grafana dashboard for rate/errors/duration
- [ ] Logs shipping to a central store with retention set
- [ ] External uptime check on `/health`
- [ ] Sentry DSN configured (SDK already in requirements)

## Strongly recommended — first month

- [ ] Load test (locust/k6) to size HPA thresholds and DB connection pool
- [ ] Define SLOs formally and review error budget monthly
- [ ] Runbook: DB failover, cert expiry, registry outage, bad deploy
- [ ] Dependabot/Renovate for dependency and base-image updates
- [ ] Container image signing (cosign) + admission policy
- [ ] NetworkPolicies restricting pod egress to the DB and DNS only
- [ ] Cost alerts on both cloud accounts

## Per-release (after go-live)

- [ ] CI green on `main`; staging verified
- [ ] Tag `vX.Y.Z` pushed; approval given by someone who didn't write the change
- [ ] Watch error rate + p95 for 15 minutes post-rollout
- [ ] Rollback decision point: >1% 5xx or failing readiness → `rollout undo`

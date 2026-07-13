# Monitoring & logging strategy

## What the app exposes

| Endpoint | Purpose | Consumer |
| --- | --- | --- |
| `/health` | Liveness — process is serving | Docker HEALTHCHECK, K8s livenessProbe |
| `/ready` | Readiness — DB reachable (`SELECT 1`) | K8s readinessProbe, load balancers |
| `/metrics` | Prometheus metrics (request rate, latency histograms, status codes per handler) | Prometheus scrape |

Metrics come from `prometheus-fastapi-instrumentator`, wired in `main.py` with
a guard so the app still runs if the package is absent.

## SLOs (starting points — revisit with real traffic)

| SLI | SLO | Measured as |
| --- | --- | --- |
| Availability | 99.9% monthly | successful `/health` probes / total |
| Error rate | < 1% of requests 5xx | `rate(http_requests_total{status=~"5.."})` / total |
| Latency | p95 < 300ms, p99 < 800ms | `http_request_duration_seconds` histogram |

## Alerting

Rules live in `monitoring/prometheus/alerts.yml`:

| Alert | Condition | Severity |
| --- | --- | --- |
| `TodoApiDown` | target unscrapable 1m | critical |
| `HighErrorRate` | 5xx > 5% for 5m | critical |
| `HighLatencyP95` | p95 > 500ms for 10m | warning |
| `ReadinessFailing` | `/ready` failing 2m | critical |

Route alerts through Alertmanager → PagerDuty/Opsgenie for critical, Slack
for warning. Page on **symptoms** (error rate, latency), not causes (CPU).

## Stack per environment

- **Local**: `docker compose --profile monitoring up` → Prometheus :9090,
  Grafana :3000 (datasource pre-provisioned from `monitoring/grafana/`).
- **Kubernetes**: install `kube-prometheus-stack` (Helm). Pods are annotated
  `prometheus.io/scrape: "true"` so the standard scrape config picks them up;
  add a PrometheusRule from `alerts.yml`. Import a FastAPI dashboard or build
  one around `http_requests_total` and `http_request_duration_seconds_bucket`.
- **Managed alternative**: AWS AMP/AMG or Azure Monitor managed Prometheus +
  Grafana if you'd rather not run the stack.

## Logging

The app logs to stdout/stderr (12-factor). Do not add file logging.

- **Local/VM**: Docker json-file driver with rotation (configured in the
  Ansible compose template: 10MB × 3 files).
- **Kubernetes**: cluster-level collector (Fluent Bit / Promtail) shipping to
  Loki, CloudWatch Logs, or Azure Log Analytics.
- **Next step in code**: switch uvicorn/app logs to JSON (e.g.
  `python-json-logger`) and add a request-ID middleware so a single request
  can be traced across replicas.

## Error tracking & tracing

- `sentry-sdk` is already in requirements — activate it by setting
  `SENTRY_DSN` and calling `sentry_sdk.init()` guarded by the env var; you get
  exception tracking with zero further code.
- When call depth grows (more services, real MCP traffic), add OpenTelemetry
  (`opentelemetry-instrumentation-fastapi` + `-sqlalchemy`) exporting OTLP to
  Tempo/Jaeger/X-Ray. Not worth the overhead for a single service today.

## Database monitoring

Rely on the managed provider: RDS Performance Insights / Azure Query
Performance Insight, plus alarms on connections, storage, and replica lag.
Alert at 80% of `max_connections` — SQLAlchemy pool defaults (5 + 10 overflow
per worker × workers × replicas) can exhaust small instances.

## Synthetic checks

Add an external uptime check (UptimeRobot, Pingdom, StatusCake) against
`https://todo.example.com/health` from outside the cluster — internal
monitoring can't see DNS, TLS, or ingress failures.

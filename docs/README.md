# Documentation index

Production deployment documentation for **fastapi-mcp-todo**.

| Document | What it covers |
| --- | --- |
| [architecture.md](architecture.md) | Infrastructure architecture — current state, target state, multi-cloud topology |
| [development-workflow.md](development-workflow.md) | Branching model, local dev, PR flow, release process |
| [cicd.md](cicd.md) | CI/CD pipelines — GitHub Actions and Azure DevOps, required secrets |
| [deployment.md](deployment.md) | How to deploy — Docker, Kubernetes, Terraform, Ansible, Render |
| [monitoring.md](monitoring.md) | Monitoring/logging strategy, SLOs, alerting, dashboards |
| [production-checklist.md](production-checklist.md) | Go-live checklist |

Related top-level assets:

```
Dockerfile, docker-compose.yml     Container build + local prod-like stack
.github/workflows/ci-cd.yml        GitHub Actions pipeline
azure-pipelines.yml                Azure DevOps pipeline
k8s/                               Kustomize base + staging/production overlays
terraform/                         AWS (EKS+RDS) and Azure (AKS+PostgreSQL) roots
ansible/                           VM-based Docker deployment playbook
monitoring/                        Prometheus + Grafana configuration
tests/                             API smoke tests run by CI
```

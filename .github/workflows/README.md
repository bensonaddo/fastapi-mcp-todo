# GitHub Actions workflow

`ci-cd.yml`: lint → test → build/push to GHCR → Trivy scan → deploy staging
(push to `main`) → deploy production (tag `v*.*.*`, approval-gated). Full
documentation in [docs/cicd.md](../../docs/cicd.md).

## ⚠️ Placeholders — replace before the deploy jobs will work

| Placeholder | Where | Replace with |
| --- | --- | --- |
| `ghcr.io/OWNER/fastapi-mcp-todo` | `ci-cd.yml` deploy steps (`kustomize edit set image` left-hand side) | Must match the image `name:` in `k8s/overlays/*/kustomization.yaml` — update both together |
| `https://todo-staging.example.com` / `https://todo.example.com` | `ci-cd.yml` environment `url` fields | Your real staging/production URLs (display-only, but keep them accurate) |

The image *pushed* by the build job needs no edit — it derives from
`github.repository` automatically.

## Required repo settings

- **Secrets**: `STAGING_KUBECONFIG`, `PROD_KUBECONFIG` — base64-encoded,
  namespace-scoped kubeconfigs (not cluster-admin).
- **Environments**: `staging` and `production`, with required reviewers on
  `production`.

For the Azure DevOps equivalent (`azure-pipelines.yml` at the repo root), set
the `containerRegistry` variable to your real ACR login server and create the
`acr-connection`, `aks-staging`, and `aks-production` service connections.

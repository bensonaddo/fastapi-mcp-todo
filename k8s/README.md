# Kubernetes manifests

Kustomize layout: `base/` holds the manifests, `overlays/{staging,production}`
set replicas, hostnames, HPA and PDB. Deploy with:

```bash
kubectl apply -k k8s/overlays/staging      # or overlays/production
```

## ⚠️ Placeholders — replace before deploying

These values are placeholders and must be set to real ones:

| Placeholder | Where | Replace with |
| --- | --- | --- |
| `ghcr.io/OWNER/fastapi-mcp-todo` | [base/deployment.yaml](base/deployment.yaml) (container `image`) | Your registry path, e.g. `ghcr.io/<your-gh-org-or-user>/fastapi-mcp-todo` or `<registry>.azurecr.io/fastapi-mcp-todo` |
| `ghcr.io/OWNER/fastapi-mcp-todo` | [overlays/staging/kustomization.yaml](overlays/staging/kustomization.yaml), [overlays/production/kustomization.yaml](overlays/production/kustomization.yaml) (`images:` block) | Same registry path — must match the `name:` CI rewrites with `kustomize edit set image` |
| `todo.example.com` | [base/ingress.yaml](base/ingress.yaml) (host + TLS host) | Your production domain |
| `todo-staging.example.com` | [overlays/staging/kustomization.yaml](overlays/staging/kustomization.yaml) (ingress patch) | Your staging domain |
| `CHANGE_ME` / `postgres-host` | [base/secret.example.yaml](base/secret.example.yaml) | Real `DATABASE_URL` — but create the secret out-of-band or via External Secrets; never commit it |
| `letsencrypt-prod` | [base/ingress.yaml](base/ingress.yaml) annotation | The name of your cert-manager ClusterIssuer, if different |

Tip: after replacing, `grep -rn "OWNER\|example.com\|CHANGE_ME" k8s/` should
return nothing.

Cluster prerequisites and the full deploy flow are in
[docs/deployment.md](../docs/deployment.md).

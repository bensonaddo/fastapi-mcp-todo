# Deployment guide

Four supported paths, from simplest to most complete. All of them run the same
container; the only contract is `DATABASE_URL` (and optionally `PORT`,
`WEB_CONCURRENCY`).

## 1. Docker (local / any host)

```bash
docker build -t fastapi-mcp-todo .
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://todo:pass@host:5432/todos \
  fastapi-mcp-todo
```

Without `DATABASE_URL` the container uses SQLite at `/app/data/todos.db` —
mount a volume there if you want that data to survive: `-v todo-data:/app/data`.

Local production-like stack (app + Postgres, optional Prometheus/Grafana):

```bash
docker compose up --build
docker compose --profile monitoring up --build   # + Prometheus :9090, Grafana :3000
```

## 2. Kubernetes (kustomize)

Layout: `k8s/base` holds the manifests; `k8s/overlays/{staging,production}`
set replicas, hostnames, HPA and PDB.

```bash
# One-time: create the database secret (or use External Secrets, below)
kubectl create namespace todo-staging
kubectl -n todo-staging create secret generic todo-api-secrets \
  --from-literal=database-url='postgresql://todo:***@db-host:5432/todos'

# Deploy
kubectl apply -k k8s/overlays/staging
kubectl -n todo-staging rollout status deployment/todo-api
```

Cluster prerequisites: NGINX ingress controller, cert-manager with a
`letsencrypt-prod` ClusterIssuer, metrics-server (for the HPA). Replace
`todo.example.com` / `todo-staging.example.com` and the `ghcr.io/OWNER/...`
image placeholders.

**Secrets, properly**: don't hand-create secrets in production. Install
External Secrets Operator and point an `ExternalSecret` at the
`database-url` entry that Terraform writes to AWS Secrets Manager or Azure
Key Vault — the cluster then stays in sync with the source of truth.

## 3. Terraform (provision the clouds)

See [terraform/README.md](../terraform/README.md). Summary:

```bash
cd terraform/aws        # EKS + RDS PostgreSQL + VPC
# or
cd terraform/azure      # AKS + PostgreSQL Flexible Server + VNet

terraform init
terraform apply -var-file=environments/staging.tfvars
$(terraform output -raw configure_kubectl)   # wires kubectl to the new cluster
```

Both roots generate the DB password, keep the database on private subnets
only, and store the full `DATABASE_URL` in the cloud secret manager.

## 4. Ansible (single VM, no Kubernetes)

```bash
cd ansible
cp inventory.ini.example inventory.ini    # fill in real hosts
ansible-galaxy collection install community.docker
ansible-playbook -i inventory.ini site.yml \
  -e app_image=ghcr.io/OWNER/fastapi-mcp-todo:v1.0.0 \
  -e database_url='postgresql://todo:***@db-host:5432/todos'
```

Installs Docker, renders a compose file, pulls the image, starts it, and
fails the play if `/health` doesn't come up. Put NGINX/Caddy in front for TLS.
Pass `database_url` via Ansible Vault, not the command line, once real
credentials exist.

## Render (existing `render.yaml`)

Still works for demos. For anything real: attach a Render PostgreSQL instance
and set `DATABASE_URL` from it (the app normalizes Render's `postgres://`
scheme automatically), and move off the free plan — free instances sleep and
their disks are ephemeral.

## Deployment order for a fresh environment

1. `terraform apply` → cluster + database + secret exist.
2. Install cluster add-ons: ingress-nginx, cert-manager, metrics-server,
   External Secrets Operator, kube-prometheus-stack.
3. Create the `ExternalSecret` (or one-time manual secret) for `todo-api-secrets`.
4. Point CI at the cluster (kubeconfig secret / service connection).
5. Push to `main` → staging deploys; tag → production deploys.

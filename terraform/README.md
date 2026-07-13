# Terraform — multi-cloud infrastructure

Two independent roots, one per cloud. Deploy to either or both; the app is
cloud-agnostic (a container + a PostgreSQL URL).

```
terraform/
  aws/    EKS cluster + RDS PostgreSQL + VPC
  azure/  AKS cluster + PostgreSQL Flexible Server + VNet
```

## Usage

```bash
cd terraform/aws          # or terraform/azure
terraform init
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars
```

## Remote state

Each root has a commented `backend` block. Before real use, create the state
store (S3 + DynamoDB lock table on AWS; storage account + container on Azure),
uncomment, and run `terraform init -migrate-state`. Never keep production
state on a laptop.

## Environments

Use one `.tfvars` file per environment (`environments/staging.tfvars`,
`environments/production.tfvars`) rather than workspaces — explicit files are
easier to review in PRs.

## Secrets

Database passwords are generated with `random_password` and stored in the
cloud secret manager (AWS Secrets Manager / Azure Key Vault). The Kubernetes
`todo-api-secrets` secret should be synced from there with External Secrets
Operator — see docs/deployment.md.

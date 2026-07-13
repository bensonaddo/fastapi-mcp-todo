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

## ⚠️ Placeholders — replace before real use

| Placeholder | Where | Replace with |
| --- | --- | --- |
| `CHANGE_ME-terraform-state` | [aws/main.tf](aws/main.tf) commented `backend "s3"` block | Your S3 state bucket name (plus region and DynamoDB lock table if renamed) |
| `CHANGEMEtfstate` | [azure/main.tf](azure/main.tf) commented `backend "azurerm"` block | Your state storage account name (plus its resource group and container) |

## Remote state

Each root has a commented `backend` block containing the placeholders above.
Before real use, create the state store (S3 bucket + DynamoDB lock table on
AWS; storage account + `tfstate` container on Azure), fill in the real names,
uncomment the block, and run `terraform init -migrate-state`. Never keep
production state on a laptop — state files contain the generated database
passwords in plaintext (they are gitignored for the same reason).

## Environments

Use one `.tfvars` file per environment (`environments/staging.tfvars`,
`environments/production.tfvars`) rather than workspaces — explicit files are
easier to review in PRs.

## Secrets

Database passwords are generated with `random_password` and stored in the
cloud secret manager (AWS Secrets Manager / Azure Key Vault). The Kubernetes
`todo-api-secrets` secret should be synced from there with External Secrets
Operator — see docs/deployment.md.

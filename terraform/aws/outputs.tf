output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "configure_kubectl" {
  value = "aws eks update-kubeconfig --region ${var.region} --name ${module.eks.cluster_name}"
}

output "db_address" {
  value = aws_db_instance.todo.address
}

output "database_url_secret_arn" {
  description = "Secrets Manager ARN holding the full DATABASE_URL"
  value       = aws_secretsmanager_secret.database_url.arn
}

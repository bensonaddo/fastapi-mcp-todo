output "cluster_name" {
  value = azurerm_kubernetes_cluster.todo.name
}

output "configure_kubectl" {
  value = "az aks get-credentials --resource-group ${azurerm_resource_group.todo.name} --name ${azurerm_kubernetes_cluster.todo.name}"
}

output "db_fqdn" {
  value = azurerm_postgresql_flexible_server.todo.fqdn
}

output "key_vault_name" {
  description = "Key Vault holding the database-url secret"
  value       = azurerm_key_vault.todo.name
}

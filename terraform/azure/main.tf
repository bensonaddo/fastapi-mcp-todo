terraform {
  required_version = ">= 1.7"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Uncomment after creating the storage account + container for state:
  # backend "azurerm" {
  #   resource_group_name  = "rg-terraform-state"
  #   storage_account_name = "CHANGEMEtfstate"
  #   container_name       = "tfstate"
  #   key                  = "fastapi-mcp-todo.tfstate"
  # }
}

provider "azurerm" {
  features {}
}

locals {
  name = "todo-${var.environment}"
  tags = {
    project     = "fastapi-mcp-todo"
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "azurerm_resource_group" "todo" {
  name     = "rg-${local.name}"
  location = var.location
  tags     = local.tags
}

# ---------------------------------------------------------------------------
# Network
# ---------------------------------------------------------------------------
resource "azurerm_virtual_network" "todo" {
  name                = "vnet-${local.name}"
  location            = azurerm_resource_group.todo.location
  resource_group_name = azurerm_resource_group.todo.name
  address_space       = ["10.1.0.0/16"]
  tags                = local.tags
}

resource "azurerm_subnet" "aks" {
  name                 = "snet-aks"
  resource_group_name  = azurerm_resource_group.todo.name
  virtual_network_name = azurerm_virtual_network.todo.name
  address_prefixes     = ["10.1.0.0/22"]
}

resource "azurerm_subnet" "db" {
  name                 = "snet-db"
  resource_group_name  = azurerm_resource_group.todo.name
  virtual_network_name = azurerm_virtual_network.todo.name
  address_prefixes     = ["10.1.4.0/24"]

  delegation {
    name = "postgres-flexible"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

resource "azurerm_private_dns_zone" "db" {
  name                = "${local.name}.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.todo.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "db" {
  name                  = "db-vnet-link"
  resource_group_name   = azurerm_resource_group.todo.name
  private_dns_zone_name = azurerm_private_dns_zone.db.name
  virtual_network_id    = azurerm_virtual_network.todo.id
}

# ---------------------------------------------------------------------------
# AKS
# ---------------------------------------------------------------------------
resource "azurerm_kubernetes_cluster" "todo" {
  name                = "aks-${local.name}"
  location            = azurerm_resource_group.todo.location
  resource_group_name = azurerm_resource_group.todo.name
  dns_prefix          = local.name
  tags                = local.tags

  default_node_pool {
    name                = "default"
    vm_size             = var.node_vm_size
    vnet_subnet_id      = azurerm_subnet.aks.id
    enable_auto_scaling = true
    min_count           = var.node_min_count
    max_count           = var.node_max_count
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin = "azure"
    network_policy = "azure"
  }
}

# ---------------------------------------------------------------------------
# PostgreSQL Flexible Server
# ---------------------------------------------------------------------------
resource "random_password" "db" {
  length  = 32
  special = false
}

resource "azurerm_postgresql_flexible_server" "todo" {
  name                          = "psql-${local.name}"
  location                      = azurerm_resource_group.todo.location
  resource_group_name           = azurerm_resource_group.todo.name
  version                       = "16"
  sku_name                      = var.db_sku_name
  storage_mb                    = 32768
  administrator_login           = "todo"
  administrator_password        = random_password.db.result
  delegated_subnet_id           = azurerm_subnet.db.id
  private_dns_zone_id           = azurerm_private_dns_zone.db.id
  public_network_access_enabled = false
  zone                          = "1"

  backup_retention_days        = var.environment == "production" ? 14 : 7
  geo_redundant_backup_enabled = var.environment == "production"

  high_availability {
    mode = var.environment == "production" ? "ZoneRedundant" : "Disabled"
  }

  depends_on = [azurerm_private_dns_zone_virtual_network_link.db]
}

resource "azurerm_postgresql_flexible_server_database" "todos" {
  name      = "todos"
  server_id = azurerm_postgresql_flexible_server.todo.id
}

# ---------------------------------------------------------------------------
# Key Vault for the connection string
# ---------------------------------------------------------------------------
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "todo" {
  name                      = "kv-${replace(local.name, "-", "")}"
  location                  = azurerm_resource_group.todo.location
  resource_group_name       = azurerm_resource_group.todo.name
  tenant_id                 = data.azurerm_client_config.current.tenant_id
  sku_name                  = "standard"
  enable_rbac_authorization = true
  tags                      = local.tags
}

resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  key_vault_id = azurerm_key_vault.todo.id
  value        = "postgresql://todo:${random_password.db.result}@${azurerm_postgresql_flexible_server.todo.fqdn}:5432/todos"
}

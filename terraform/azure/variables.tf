variable "location" {
  type    = string
  default = "eastus"
}

variable "environment" {
  type        = string
  description = "staging or production"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production."
  }
}

variable "node_vm_size" {
  type    = string
  default = "Standard_D2s_v5"
}

variable "node_min_count" {
  type    = number
  default = 2
}

variable "node_max_count" {
  type    = number
  default = 6
}

variable "db_sku_name" {
  type    = string
  default = "B_Standard_B1ms"
}

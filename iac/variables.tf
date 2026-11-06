variable "region" {
  description = "AWS region for everything except CloudFront (which is global)"
  type        = string
  default     = "ap-south-1"
}

variable "project" {
  type    = string
  default = "rrfc"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "lambda_memory_mb" {
  description = "More memory also means more CPU, which speeds up bcrypt and cold starts"
  type        = number
  default     = 512
}

variable "api_rate_limit" {
  description = "Steady-state requests per second across the whole API"
  type        = number
  default     = 20
}

variable "auth_rate_limit" {
  description = "Requests per second for login/register, to slow down password guessing"
  type        = number
  default     = 2
}

locals {
  name = "${var.project}-${var.environment}"
  # The Node app builds table names as TABLE_PREFIX + users/polls/games
  table_prefix = "${local.name}-"
}

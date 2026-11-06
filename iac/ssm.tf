# JWT signing secrets, generated once and stored encrypted in SSM. The Lambda reads them on cold start.

resource "random_password" "jwt_access" {
  length  = 64
  special = false
}

resource "random_password" "jwt_refresh" {
  length  = 64
  special = false
}

resource "aws_ssm_parameter" "jwt_access" {
  name  = "/${var.project}/${var.environment}/jwt-access-secret"
  type  = "SecureString"
  value = random_password.jwt_access.result
}

resource "aws_ssm_parameter" "jwt_refresh" {
  name  = "/${var.project}/${var.environment}/jwt-refresh-secret"
  type  = "SecureString"
  value = random_password.jwt_refresh.result
}

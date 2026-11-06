# Node.js (Express) backend. Build the bundle first: cd BE/node && npm run build:lambda

data "archive_file" "api" {
  type        = "zip"
  source_dir  = "${path.module}/../BE/node/dist-lambda"
  output_path = "${path.module}/build/api.zip"
}

resource "aws_iam_role" "api" {
  name = "${local.name}-api"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "api_logs" {
  role       = aws_iam_role.api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "api" {
  name = "app-access"
  role = aws_iam_role.api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
        ]
        Resource = flatten([for t in local.tables : [t.arn, "${t.arn}/index/*"]])
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameters"]
        Resource = [aws_ssm_parameter.jwt_access.arn, aws_ssm_parameter.jwt_refresh.arn]
      },
    ]
  })
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.name}-api"
  retention_in_days = 14
}

resource "aws_lambda_function" "api" {
  function_name    = "${local.name}-api"
  role             = aws_iam_role.api.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256
  memory_size      = var.lambda_memory_mb
  timeout          = 15

  # CORS_ORIGIN is empty because CloudFront serves the FE and /api from one domain
  environment {
    variables = {
      NODE_ENV                 = "production"
      NODE_OPTIONS             = "--enable-source-maps"
      TABLE_PREFIX             = local.table_prefix
      COOKIE_SECURE            = "true"
      CORS_ORIGIN              = ""
      JWT_ACCESS_SECRET_PARAM  = aws_ssm_parameter.jwt_access.name
      JWT_REFRESH_SECRET_PARAM = aws_ssm_parameter.jwt_refresh.name
    }
  }

  depends_on = [aws_cloudwatch_log_group.api, aws_iam_role_policy_attachment.api_logs]
}

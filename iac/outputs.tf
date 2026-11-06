output "app_url" {
  description = "Open this in the browser"
  value       = "https://${aws_cloudfront_distribution.web.domain_name}"
}

output "api_gateway_url" {
  description = "Direct API Gateway URL (the app uses <app_url>/api instead)"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "web_bucket" {
  value = aws_s3_bucket.web.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.web.id
}

output "lambda_function_name" {
  value = aws_lambda_function.api.function_name
}

output "table_prefix" {
  description = "Use as TABLE_PREFIX when running the seed script against AWS"
  value       = local.table_prefix
}

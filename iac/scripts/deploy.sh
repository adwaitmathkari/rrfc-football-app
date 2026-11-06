#!/usr/bin/env bash
# Builds the Node Lambda + React app, applies Terraform, and uploads the frontend.
# Needs: terraform, AWS CLI credentials for the target account (e.g. AWS_PROFILE=...), Node.js.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IAC="$ROOT/iac"

echo "==> Building Lambda bundle"
(cd "$ROOT/BE/node" && npm ci && npm run build:lambda)

echo "==> Building frontend"
# Empty API URL = same origin; CloudFront routes /api/* to API Gateway
(cd "$ROOT/FE" && npm ci && VITE_BACKEND=node VITE_NODE_API_URL="" npm run build)

echo "==> Applying Terraform"
terraform -chdir="$IAC" init -input=false
terraform -chdir="$IAC" apply

BUCKET="$(terraform -chdir="$IAC" output -raw web_bucket)"
DISTRIBUTION="$(terraform -chdir="$IAC" output -raw cloudfront_distribution_id)"

echo "==> Uploading frontend to s3://$BUCKET"
# Hashed asset files never change, so cache them forever; index.html must always be revalidated
aws s3 sync "$ROOT/FE/dist/assets" "s3://$BUCKET/assets" --delete \
  --cache-control "public,max-age=31536000,immutable"
aws s3 sync "$ROOT/FE/dist" "s3://$BUCKET" --delete --exclude "assets/*" \
  --cache-control "no-cache"

echo "==> Invalidating CloudFront cache"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" --paths "/*" >/dev/null

echo "Deployed: $(terraform -chdir="$IAC" output -raw app_url)"

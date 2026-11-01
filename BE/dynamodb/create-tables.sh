#!/bin/sh
# Idempotently creates the tables used by both backends.
set -e

ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:8000}"
PREFIX="${TABLE_PREFIX:-football_}"

until aws dynamodb list-tables --endpoint-url "$ENDPOINT" >/dev/null 2>&1; do
  echo "Waiting for DynamoDB at $ENDPOINT ..."
  sleep 1
done

create_table() {
  name="$1"
  shift
  if aws dynamodb describe-table --endpoint-url "$ENDPOINT" --table-name "$name" >/dev/null 2>&1; then
    echo "Table $name already exists"
  else
    aws dynamodb create-table --endpoint-url "$ENDPOINT" --table-name "$name" \
      --billing-mode PAY_PER_REQUEST "$@" >/dev/null
    echo "Created table $name"
  fi
}

create_table "${PREFIX}users" \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=email,AttributeType=S \
    AttributeName=phone,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes '[
    {"IndexName":"email-index","KeySchema":[{"AttributeName":"email","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},
    {"IndexName":"phone-index","KeySchema":[{"AttributeName":"phone","KeyType":"HASH"}],"Projection":{"ProjectionType":"KEYS_ONLY"}}
  ]'

create_table "${PREFIX}polls" \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH

create_table "${PREFIX}games" \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH

echo "DynamoDB tables ready"

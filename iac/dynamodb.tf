# Same schema as BE/dynamodb/create-tables.sh (used for DynamoDB Local).

resource "aws_dynamodb_table" "users" {
  name                        = "${local.table_prefix}users"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "id"
  deletion_protection_enabled = true

  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "email"
    type = "S"
  }
  attribute {
    name = "phone"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    projection_type = "ALL"

    key_schema {
      attribute_name = "email"
      key_type       = "HASH"
    }
  }

  global_secondary_index {
    name            = "phone-index"
    projection_type = "KEYS_ONLY"

    key_schema {
      attribute_name = "phone"
      key_type       = "HASH"
    }
  }

  point_in_time_recovery {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_dynamodb_table" "polls" {
  name                        = "${local.table_prefix}polls"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "id"
  deletion_protection_enabled = true

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_dynamodb_table" "games" {
  name                        = "${local.table_prefix}games"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "id"
  deletion_protection_enabled = true

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

locals {
  tables = [aws_dynamodb_table.users, aws_dynamodb_table.polls, aws_dynamodb_table.games]
}

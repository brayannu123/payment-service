provider "aws" {
  region = var.aws_region
}

resource "aws_dynamodb_table" "payment" {
  name         = "payment"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "traceId"

  attribute {
    name = "traceId"
    type = "S"
  }
}

resource "aws_sqs_queue" "transaction_queue" {
  name = "transaction-queue"
}

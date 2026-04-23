provider "aws" {
  region = var.aws_region
}

# --- DynamoDB ---
resource "aws_dynamodb_table" "payment" {
  name           = "payment"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "traceId"

  attribute {
    name = "traceId"
    type = "S"
  }
}

# --- IAM Role for Lambda ---
resource "aws_iam_role" "lambda_exec" {
  name = "payment_processor_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# --- IAM Policy for Lambda (DynamoDB & SQS) ---
resource "aws_iam_policy" "lambda_policy" {
  name        = "payment_processor_lambda_policy"
  description = "IAM policy for payment processor lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.payment.arn
      },
      {
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Effect   = "Allow"
        Resource = var.transaction_queue_arn
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# --- Lambda Function ---
resource "aws_lambda_function" "payment_processor" {
  filename      = "lambda_function_payload.zip"
  function_name = var.lambda_function_name
  role          = aws_iam_role.lambda_exec.arn
  handler       = "dist/lambda.handler" # Handler path in dist folder
  runtime       = "nodejs18.x"

  environment {
    variables = {
      PAYMENT_TABLE        = aws_dynamodb_table.payment.name
      AWS_REGION           = var.aws_region
      TRANSACTION_QUEUE_URL = var.transaction_queue_url
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# --- SQS Trigger for Lambda ---
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = var.transaction_queue_arn
  function_name    = aws_lambda_function.payment_processor.arn
  batch_size       = 10
}

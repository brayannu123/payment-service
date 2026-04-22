output "sqs_url" {
  description = "The URL of the SQS queue"
  value       = aws_sqs_queue.transaction_queue.id
}

output "dynamodb_table" {
  description = "The name of the DynamoDB table"
  value       = aws_dynamodb_table.payment.name
}

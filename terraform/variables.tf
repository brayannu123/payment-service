variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "payment-processor-lambda"
}

variable "transaction_queue_url" {
  description = "The URL of the SQS queue (provided by another service)"
  type        = string
}

variable "transaction_queue_arn" {
  description = "The ARN of the SQS queue (provided by another service)"
  type        = string
}

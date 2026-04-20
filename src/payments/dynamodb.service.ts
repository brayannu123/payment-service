import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Payment, PaymentStatus } from './interfaces/payment.interface';

@Injectable()
export class DynamoDBService {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName = process.env.PAYMENT_TABLE || 'payment';
  private readonly logger = new Logger(DynamoDBService.name);

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    const ddbClient = new DynamoDBClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
    this.client = DynamoDBDocumentClient.from(ddbClient);
  }

  async getPayment(traceId: string): Promise<Payment | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { traceId },
      });
      const response = await this.client.send(command);
      return (response.Item as Payment) || null;
    } catch (error) {
      this.logger.error(`Error getting payment ${traceId}: ${error.message}`);
      throw error;
    }
  }

  async createPayment(payment: Payment): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: payment,
      });
      await this.client.send(command);
    } catch (error) {
      this.logger.error(`Error creating payment: ${error.message}`);
      throw error;
    }
  }

  async updatePaymentStatus(traceId: string, status: PaymentStatus): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { traceId },
        UpdateExpression: 'set #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': status },
      });
      await this.client.send(command);
    } catch (error) {
      this.logger.error(`Error updating status for ${traceId}: ${error.message}`);
      throw error;
    }
  }
}

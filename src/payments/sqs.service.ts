import { Injectable, Logger } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class SqsService {
  private readonly client: SQSClient;
  private readonly logger = new Logger(SqsService.name);

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    this.client = new SQSClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }

  async sendMessage(queueUrl: string, body: any): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(body),
      });
      await this.client.send(command);
      this.logger.log(`Message sent to ${queueUrl}`);
    } catch (error) {
      this.logger.error(`Error sending message to ${queueUrl}: ${error.message}`);
      throw error;
    }
  }
}

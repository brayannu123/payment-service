import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  SQSClient, 
  ReceiveMessageCommand, 
  DeleteMessageCommand, 
  Message 
} from '@aws-sdk/client-sqs';
import { TransactionProcessorService } from './transaction-processor.service';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsConsumerService.name);
  private readonly sqsClient: SQSClient;
  private isRunning = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly processor: TransactionProcessorService,
  ) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    this.sqsClient = new SQSClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }

  onModuleInit() {
    this.isRunning = true;
    this.pollMessages();
    this.logger.log('SQS Consumer started');
  }

  onModuleDestroy() {
    this.isRunning = false;
    this.logger.log('SQS Consumer stopping...');
  }

  private async pollMessages() {
    const queueUrl = this.configService.get<string>('TRANSACTION_QUEUE_URL');

    if (!queueUrl) {
      this.logger.error('TRANSACTION_QUEUE_URL is not defined in environment variables');
      return;
    }

    while (this.isRunning) {
      try {
        const receiveCommand = new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 20, // Long polling
        });

        const response = await this.sqsClient.send(receiveCommand);

        if (response.Messages && response.Messages.length > 0) {
          for (const message of response.Messages) {
            await this.handleMessage(message, queueUrl);
          }
        }
      } catch (error) {
        this.logger.error(`Error polling SQS: ${error.message}`);
        // Wait a bit before retrying on error to avoid tight loops
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  private async handleMessage(message: Message, queueUrl: string) {
    this.logger.log(`Received message: ${message.MessageId}`);

    try {
      const body = JSON.parse(message.Body || '{}');
      const { traceId } = body;

      if (!traceId) {
        this.logger.warn(`Message ${message.MessageId} does not contain traceId`);
      } else {
        await this.processor.process(traceId);
      }

      // Delete message after successful processing
      const deleteCommand = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle!,
      });

      await this.sqsClient.send(deleteCommand);
      this.logger.log(`Deleted message: ${message.MessageId}`);
    } catch (error) {
      this.logger.error(`Error handling message ${message.MessageId}: ${error.message}`);
      // On error, message will return to queue after visibility timeout
    }
  }
}

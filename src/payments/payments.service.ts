import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBService } from './dynamodb.service';
import { SqsService } from './sqs.service';
import { PaymentStatus, Payment } from './interfaces/payment.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly dynamoDbService: DynamoDBService,
    private readonly sqsService: SqsService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get transactionQueueUrl() {
    return this.configService.get<string>('TRANSACTION_QUEUE_URL');
  }

  private get externalApiUrl() {
    return (
      this.configService.get<string>('EXTERNAL_API_URL') ||
      'http://external-api.com'
    );
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<string> {
    const traceId = uuidv4();

    const payment: Payment = {
      traceId,
      ...createPaymentDto,
      status: PaymentStatus.INITIAL,
      timestamp: new Date().getTime().toString(),
    };

    try {
      await this.dynamoDbService.createPayment(payment);
      this.logger.log(`Payment created with traceId: ${traceId}`);
      return traceId;
    } catch (error) {
      this.logger.error(`Error creating payment in service: ${error.message}`);
      throw error;
    }
  }

  async checkBalance(traceId: string): Promise<void> {
    this.logger.log(`Checking balance for traceId: ${traceId}`);

    const payment = await this.dynamoDbService.getPayment(traceId);

    if (!payment) {
      this.logger.warn(`Payment not found for traceId: ${traceId}`);
      return;
    }

    const hasBalance = await this.validateCardBalance(payment.cardId);

    if (hasBalance) {
      this.logger.log(
        `Balance confirmed for ${traceId}. Moving to IN_PROGRESS.`,
      );

      await this.dynamoDbService.updatePaymentStatus(
        traceId,
        PaymentStatus.IN_PROGRESS,
      );

      if (this.transactionQueueUrl) {
        await this.sqsService.sendMessage(this.transactionQueueUrl, {
          traceId,
        });

        this.logger.log(`Message sent to SQS for ${traceId}`);
      } else {
        this.logger.warn(
          'TRANSACTION_QUEUE_URL not configured. Message not sent.',
        );
      }
    } else {
      this.logger.warn(
        `Insufficient balance for ${traceId}. Marking as FAILED.`,
      );

      await this.dynamoDbService.updatePaymentStatus(
        traceId,
        PaymentStatus.FAILED,
      );
    }
  }

  async processTransaction(traceId: string): Promise<void> {
    this.logger.log(`Processing transaction for traceId: ${traceId}`);

    const payment = await this.dynamoDbService.getPayment(traceId);

    if (!payment) {
      this.logger.warn(`Payment not found for traceId: ${traceId}`);
      return;
    }

    try {
      const payload = {
        merchant: 'Sistema pagos',
        cardId: payment.cardId,
        amount: 75000,
      };

      await firstValueFrom(
        this.httpService.post(
          `${this.externalApiUrl}/transactions/purchase`,
          payload,
        ),
      );

      await this.dynamoDbService.updatePaymentStatus(
        traceId,
        PaymentStatus.FINISH,
      );

      this.logger.log(`Transaction finished successfully for ${traceId}`);
    } catch (error) {
      this.logger.error(
        `Error processing transaction for ${traceId}: ${error.message}`,
      );

      await this.dynamoDbService.updatePaymentStatus(
        traceId,
        PaymentStatus.FAILED,
      );
    }
  }

  private async validateCardBalance(cardId: string): Promise<boolean> {
    this.logger.log(`Validating balance for card: ${cardId}`);
    return true;
  }
}

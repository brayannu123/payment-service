import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { DynamoDBService } from './dynamodb.service';
import { PaymentStatus } from './interfaces/payment.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly dynamoDbService: DynamoDBService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get externalApiUrl() {
    return (
      this.configService.get<string>('EXTERNAL_API_URL') ||
      'http://external-api.com'
    );
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

      // Llamada simulada o real a API externa
      this.logger.log(`Calling external API for ${traceId}...`);
      
      // En un entorno real, descomentarías esto:
      // await firstValueFrom(
      //   this.httpService.post(
      //     `${this.externalApiUrl}/transactions/purchase`,
      //     payload,
      //   ),
      // );

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
      
      throw error;
    }
  }
}

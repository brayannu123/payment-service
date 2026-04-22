import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBService } from '../payments/dynamodb.service';
import { PaymentStatus } from '../payments/interfaces/payment.interface';

@Injectable()
export class TransactionProcessorService {
  private readonly logger = new Logger(TransactionProcessorService.name);

  constructor(private readonly dynamoDbService: DynamoDBService) {}

  async process(traceId: string): Promise<void> {
    this.logger.log(`Processing transaction for traceId: ${traceId}`);

    try {
      // Simular procesamiento
      this.logger.log(`Simulating external API call for ${traceId}...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Actualizar estado a FINISH
      await this.dynamoDbService.updatePaymentStatus(traceId, PaymentStatus.FINISH);
      
      this.logger.log(`Transaction ${traceId} successfully processed and marked as FINISH`);
    } catch (error) {
      this.logger.error(`Error processing transaction ${traceId}: ${error.message}`);
      
      // Intentar marcar como FAILED si algo sale mal
      try {
        await this.dynamoDbService.updatePaymentStatus(traceId, PaymentStatus.FAILED);
      } catch (updateError) {
        this.logger.error(`Could not update status to FAILED for ${traceId}: ${updateError.message}`);
      }
      
      throw error;
    }
  }
}

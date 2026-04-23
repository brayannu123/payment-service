import { Injectable, Logger } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class TransactionProcessorService {
  private readonly logger = new Logger(TransactionProcessorService.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  async process(traceId: string): Promise<void> {
    this.logger.log(`Worker received traceId: ${traceId}`);
    
    try {
      await this.paymentsService.processTransaction(traceId);
      this.logger.log(`Worker successfully processed traceId: ${traceId}`);
    } catch (error) {
      this.logger.error(`Worker failed to process traceId ${traceId}: ${error.message}`);
      throw error;
    }
  }
}

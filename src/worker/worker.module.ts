import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SqsConsumerService } from './sqs-consumer.service';
import { TransactionProcessorService } from './transaction-processor.service';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PaymentsModule,
  ],
  providers: [
    SqsConsumerService,
    TransactionProcessorService,
  ],
})
export class WorkerModule {}

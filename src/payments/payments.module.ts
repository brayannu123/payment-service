import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';
import { DynamoDBService } from './dynamodb.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [
    PaymentsService,
    DynamoDBService,
  ],
  exports: [
    PaymentsService,
    DynamoDBService, 
  ],
})
export class PaymentsModule {}

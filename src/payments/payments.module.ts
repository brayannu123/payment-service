import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';
import { DynamoDBService } from './dynamodb.service';
import { SqsService } from './sqs.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [HttpModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, DynamoDBService, SqsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

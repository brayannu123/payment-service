import { NestFactory } from '@nestjs/core';
import { SQSEvent, SQSHandler } from 'aws-lambda';
import { WorkerModule } from './worker/worker.module';
import { TransactionProcessorService } from './worker/transaction-processor.service';
import { Logger } from '@nestjs/common';

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    cachedApp = await NestFactory.createApplicationContext(WorkerModule);
  }
  return cachedApp;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  const logger = new Logger('LambdaHandler');
  const app = await bootstrap();
  const processor = app.get(TransactionProcessorService);

  logger.log(`Processing ${event.Records.length} SQS records`);

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      const { traceId } = body;

      if (!traceId) {
        logger.warn(`Record ${record.messageId} does not contain traceId`);
        continue;
      }

      await processor.process(traceId);
      logger.log(`Successfully processed traceId: ${traceId}`);
    } catch (error) {
      logger.error(`Error processing record ${record.messageId}: ${error.message}`);
      // Re-throw to let SQS handle retries if necessary, 
      // or handle specifically based on requirements.
      throw error;
    }
  }
};

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const logger = new Logger('WorkerMain');
  const app = await NestFactory.createApplicationContext(WorkerModule);
  
  logger.log('Payment Service Worker is running...');
  
  // Ensure the app doesn't exit immediately
  process.on('SIGINT', async () => {
    logger.log('Shutting down worker...');
    await app.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.log('Shutting down worker...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();

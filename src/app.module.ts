import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { PaymentsModule } from './payments/payments.module';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PaymentsModule,
    WorkerModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}

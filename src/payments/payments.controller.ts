import { Controller, Post, Body, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    this.logger.log('Received request to create payment');
    const traceId = await this.paymentsService.create(createPaymentDto);
    return { traceId };
  }

  @Post('check-balance')
  async handleCheckBalance(@Body() data: { traceId: string }) {
    this.logger.log(`Received check-balance trigger for traceId: ${data.traceId}`);
    await this.paymentsService.checkBalance(data.traceId);
    return { status: 'Processing' };
  }

  @Post('transaction')
  async handleTransaction(@Body() data: { traceId: string }) {
    this.logger.log(`Received transaction trigger for traceId: ${data.traceId}`);
    await this.paymentsService.processTransaction(data.traceId);
    return { status: 'Processing' };
  }
}

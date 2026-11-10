import { Controller, Post, Body, Res, HttpStatus, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import type { Response } from 'express';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  async webhook(@Body() event: unknown, @Res() res: Response) {
    // Prototype: the webhook body is accepted without Stripe signature verification.
    // Add raw-body signature verification before production.
    try {
      const result = await this.paymentService.handleWebhook(event);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.logger.error('Webhook error', error instanceof Error ? error.stack : String(error));
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${message}`);
    }
  }
}

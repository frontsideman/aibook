import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Response } from 'express';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  async webhook(@Body() event: any, @Res() res: Response) {
    // In production, you would use the raw body to verify Stripe signature
    // For this prototype, we'll accept the JSON body directly
    try {
      const result = await this.paymentService.handleWebhook(event);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Webhook error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${message}`);
    }
  }
}

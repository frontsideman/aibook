import { Controller, Post, Body, Req, Res, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Request, Response } from 'express';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  async webhook(@Body() event: any, @Req() req: Request, @Res() res: Response) {
    // In production, you would use the raw body to verify Stripe signature
    // For this prototype, we'll accept the JSON body directly
    try {
      const result = await this.paymentService.handleWebhook(event);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${error.message}`);
    }
  }
}

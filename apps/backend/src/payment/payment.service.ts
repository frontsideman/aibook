import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface StripeEvent {
  type: string;
  data: { object: Record<string, unknown> };
}

interface CheckoutSession {
  customer_details: { email: string };
}

interface Subscription {
  metadata?: { email?: string };
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private prisma: PrismaService) {}

  async handleWebhook(event: unknown) {
    const stripeEvent = event as StripeEvent;
    this.logger.log(`Received webhook event: ${stripeEvent.type}`);

    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as unknown as CheckoutSession;
      const customerEmail = session.customer_details?.email;

      if (customerEmail) {
        await this.prisma.client.user.update({
          where: { email: customerEmail },
          data: { subscriptionActive: true },
        });
        this.logger.log(`Subscription activated for ${customerEmail}`);
      }
    } else if (stripeEvent.type === 'customer.subscription.deleted') {
      const subscription = stripeEvent.data.object as unknown as Subscription;
      const customerEmail = subscription.metadata?.email;

      if (customerEmail) {
        await this.prisma.client.user.update({
          where: { email: customerEmail },
          data: { subscriptionActive: false },
        });
        this.logger.log(`Subscription deactivated for ${customerEmail}`);
      }
    }

    return { received: true };
  }
}

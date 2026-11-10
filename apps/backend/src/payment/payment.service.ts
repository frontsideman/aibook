import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface StripeEvent {
  type: string;
  data: { object: Record<string, unknown> };
}

interface CheckoutSession {
  customer_details?: { email?: string };
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
        await this.setSubscription(customerEmail, true);
      }
    } else if (stripeEvent.type === 'customer.subscription.deleted') {
      const subscription = stripeEvent.data.object as unknown as Subscription;
      const customerEmail = subscription.metadata?.email;

      if (customerEmail) {
        await this.setSubscription(customerEmail, false);
      }
    }

    return { received: true };
  }

  private async setSubscription(email: string, active: boolean) {
    try {
      await this.prisma.client.user.update({
        where: { email },
        data: { subscriptionActive: active },
      });
      this.logger.log(`Subscription ${active ? 'activated' : 'deactivated'} for ${email}`);
    } catch (error) {
      const prismaError = error as { code?: string } | null;
      if (prismaError?.code === 'P2025') {
        this.logger.warn(`No user found for webhook email ${email}`);
        return;
      }

      throw error;
    }
  }
}

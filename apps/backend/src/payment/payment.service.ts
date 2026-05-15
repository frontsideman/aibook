import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private prisma: PrismaService) {}

  async handleWebhook(event: any) {
    this.logger.log(`Received webhook event: ${event.type}`);

    // In a real implementation, you would verify the signature and handle different event types
    // For this prototype, we'll assume a 'checkout.session.completed' event from Stripe
    // and update the user's subscription status.

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_details.email;

      if (customerEmail) {
        await this.prisma.client.user.update({
          where: { email: customerEmail },
          data: { subscriptionActive: true },
        });
        this.logger.log(`Subscription activated for ${customerEmail}`);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      // In a real app, you'd find the user by Stripe customer ID
      // For now, let's assume we have the email in metadata or something
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

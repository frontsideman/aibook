import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPrismaService = {
    client: {
      user: {
        update: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('activates a subscription for a checkout session email', async () => {
    mockPrismaService.client.user.update.mockResolvedValue({});

    await expect(
      service.handleWebhook({
        type: 'checkout.session.completed',
        data: { object: { customer_details: { email: 'parent@example.com' } } },
      })
    ).resolves.toEqual({ received: true });

    expect(mockPrismaService.client.user.update).toHaveBeenCalledWith({
      where: { email: 'parent@example.com' },
      data: { subscriptionActive: true },
    });
  });

  it('deactivates a subscription using subscription metadata', async () => {
    mockPrismaService.client.user.update.mockResolvedValue({});

    await service.handleWebhook({
      type: 'customer.subscription.deleted',
      data: { object: { metadata: { email: 'parent@example.com' } } },
    });

    expect(mockPrismaService.client.user.update).toHaveBeenCalledWith({
      where: { email: 'parent@example.com' },
      data: { subscriptionActive: false },
    });
  });

  it('acknowledges events for unknown users', async () => {
    mockPrismaService.client.user.update.mockRejectedValue({ code: 'P2025' });

    await expect(
      service.handleWebhook({
        type: 'checkout.session.completed',
        data: { object: { customer_details: { email: 'missing@example.com' } } },
      })
    ).resolves.toEqual({ received: true });
  });

  it('ignores events without an email', async () => {
    await service.handleWebhook({
      type: 'checkout.session.completed',
      data: { object: {} },
    });

    expect(mockPrismaService.client.user.update).not.toHaveBeenCalled();
  });
});

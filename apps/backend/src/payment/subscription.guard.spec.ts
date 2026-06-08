import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { SubscriptionGuard } from './subscription.guard';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;

  const mockPrismaService = {
    client: {
      user: {
        findUnique: jest.fn(),
      },
    },
  };

  const createContext = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionGuard, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    guard = module.get(SubscriptionGuard);
  });

  it('allows active subscriptions from request user email', async () => {
    mockPrismaService.client.user.findUnique.mockResolvedValue({
      email: 'mock@example.com',
      subscriptionActive: true,
    });

    await expect(
      guard.canActivate(
        createContext({
          user: { email: 'mock@example.com' },
          headers: {},
        })
      )
    ).resolves.toBe(true);
  });

  it('rejects missing email', async () => {
    await expect(
      guard.canActivate(
        createContext({
          headers: {},
        })
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects inactive subscriptions', async () => {
    mockPrismaService.client.user.findUnique.mockResolvedValue({
      email: 'mock@example.com',
      subscriptionActive: false,
    });

    await expect(
      guard.canActivate(
        createContext({
          user: { email: 'mock@example.com' },
          headers: {},
        })
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

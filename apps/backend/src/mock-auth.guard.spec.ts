import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { MockAuthGuard } from './mock-auth.guard';

describe('MockAuthGuard', () => {
  let guard: MockAuthGuard;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockPrismaService = {
    client: {
      user: {
        upsert: jest.fn(),
      },
    },
  };

  const createContext = () =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    }) as ExecutionContext;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockAuthGuard,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = module.get(MockAuthGuard);
  });

  it('returns false when mock auth is disabled', async () => {
    mockConfigService.get.mockReturnValue('false');

    await expect(guard.canActivate(createContext())).resolves.toBe(false);
    expect(mockPrismaService.client.user.upsert).not.toHaveBeenCalled();
  });

  it('ensures the mock user exists and injects it into the request', async () => {
    mockConfigService.get.mockReturnValue('true');
    mockPrismaService.client.user.upsert.mockResolvedValue({
      id: 'mock-user-id',
      email: 'mock@example.com',
    });

    const request: Record<string, unknown> = {};
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(mockPrismaService.client.user.upsert).toHaveBeenCalledWith({
      where: { id: 'mock-user-id' },
      update: {
        email: 'mock@example.com',
      },
      create: {
        id: 'mock-user-id',
        email: 'mock@example.com',
      },
    });
    expect(request.user).toEqual({
      id: 'mock-user-id',
      email: 'mock@example.com',
      name: 'Mock User',
    });
  });
});

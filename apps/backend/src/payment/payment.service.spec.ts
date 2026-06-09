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

    service = module.get(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

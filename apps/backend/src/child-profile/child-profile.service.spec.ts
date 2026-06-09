import { Test, type TestingModule } from '@nestjs/testing';
import { ChildProfileService } from './child-profile.service';
import { PrismaService } from '../prisma.service';

describe('ChildProfileService', () => {
  let service: ChildProfileService;

  const mockPrismaClient = {
    childProfile: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockPrismaService = { client: mockPrismaClient };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChildProfileService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ChildProfileService>(ChildProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a child profile', async () => {
      const dto = {
        name: 'John',
        age: 5,
        gender: 'boy',
        interests: ['dinosaurs'],
        userId: 'user123',
      };
      const expectedResult = { id: 'cp123', ...dto };
      (mockPrismaClient.childProfile.create as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.create(dto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaClient.childProfile.create).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });
});

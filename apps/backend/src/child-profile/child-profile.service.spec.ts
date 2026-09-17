import { Test, type TestingModule } from '@nestjs/testing';
import { ChildProfileService } from './child-profile.service';
import { PrismaService } from '../prisma.service';

describe('ChildProfileService', () => {
  let service: ChildProfileService;

  const mockPrismaClient = {
    childProfile: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
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

  describe('user scoping', () => {
    it('scopes findOne by userId', async () => {
      (mockPrismaClient.childProfile.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne('cp1', 'user-1');

      expect(mockPrismaClient.childProfile.findFirst).toHaveBeenCalledWith({
        where: { id: 'cp1', userId: 'user-1' },
      });
      expect(result).toBeNull();
    });

    it('throws NotFound when updating a foreign profile', async () => {
      (mockPrismaClient.childProfile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update('cp1', 'user-1', { name: 'X' })).rejects.toThrow(
        'Child profile not found'
      );
      expect(mockPrismaClient.childProfile.update).not.toHaveBeenCalled();
    });

    it('throws NotFound when deleting a foreign profile', async () => {
      (mockPrismaClient.childProfile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('cp1', 'user-1')).rejects.toThrow('Child profile not found');
      expect(mockPrismaClient.childProfile.delete).not.toHaveBeenCalled();
    });
  });
});

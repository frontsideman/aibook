import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ChildProfileService } from './child-profile.service';
import { PrismaService } from '../prisma.service';

describe('ChildProfileService', () => {
  let service: ChildProfileService;

  const mockPrismaClient = {
    childProfile: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockPrismaService = { client: mockPrismaClient };

  beforeEach(async () => {
    jest.clearAllMocks();
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
        gender: 'male',
        interests: ['dinosaurs'],
        userId: 'user123',
      };
      const expectedResult = { id: 'cp123', ...dto };
      mockPrismaClient.childProfile.create.mockResolvedValue(expectedResult);

      const result = await service.create(dto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaClient.childProfile.create).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });

  describe('findAll', () => {
    it('scopes profiles to the user', async () => {
      mockPrismaClient.childProfile.findMany.mockResolvedValue([]);

      await service.findAll('user-1');

      expect(mockPrismaClient.childProfile.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('findOne', () => {
    it('scopes the lookup to the user', async () => {
      mockPrismaClient.childProfile.findFirst.mockResolvedValue(null);

      await expect(service.findOne('cp1', 'user-1')).resolves.toBeNull();
      expect(mockPrismaClient.childProfile.findFirst).toHaveBeenCalledWith({
        where: { id: 'cp1', userId: 'user-1' },
      });
    });
  });

  describe('update', () => {
    it('rejects a foreign profile', async () => {
      mockPrismaClient.childProfile.findFirst.mockResolvedValue(null);

      await expect(service.update('cp1', 'user-1', { name: 'New' })).rejects.toThrow(
        NotFoundException
      );
      expect(mockPrismaClient.childProfile.update).not.toHaveBeenCalled();
    });

    it('updates an owned profile', async () => {
      mockPrismaClient.childProfile.findFirst.mockResolvedValue({ id: 'cp1' });
      mockPrismaClient.childProfile.update.mockResolvedValue({ id: 'cp1', name: 'New' });

      await expect(service.update('cp1', 'user-1', { name: 'New' })).resolves.toEqual({
        id: 'cp1',
        name: 'New',
      });
      expect(mockPrismaClient.childProfile.update).toHaveBeenCalledWith({
        where: { id: 'cp1' },
        data: { name: 'New' },
      });
    });
  });

  describe('remove', () => {
    it('rejects a foreign profile', async () => {
      mockPrismaClient.childProfile.findFirst.mockResolvedValue(null);

      await expect(service.remove('cp1', 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockPrismaClient.childProfile.delete).not.toHaveBeenCalled();
    });

    it('deletes an owned profile', async () => {
      mockPrismaClient.childProfile.findFirst.mockResolvedValue({ id: 'cp1' });
      mockPrismaClient.childProfile.delete.mockResolvedValue({ id: 'cp1' });

      await expect(service.remove('cp1', 'user-1')).resolves.toEqual({ id: 'cp1' });
    });
  });
});

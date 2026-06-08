import { Test, TestingModule } from '@nestjs/testing';
import { StoryLibraryService } from './story-library.service';
import { PrismaService } from '../prisma.service';

describe('StoryLibraryService', () => {
  let service: StoryLibraryService;
  let prisma: PrismaService;

  const mockPrismaClient = {
    storyLibrary: {
      findMany: jest.fn(),
    },
  };

  const mockPrismaService = {
    client: mockPrismaClient,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoryLibraryService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<StoryLibraryService>(StoryLibraryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all stories without search', async () => {
    mockPrismaClient.storyLibrary.findMany.mockResolvedValue([]);
    await service.findAll({});
    expect(prisma.client.storyLibrary.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { title: 'asc' },
      take: 10,
      skip: 0,
    });
  });

  it('should search stories by title', async () => {
    mockPrismaClient.storyLibrary.findMany.mockResolvedValue([]);
    await service.findAll({ search: 'wolf' });
    expect(prisma.client.storyLibrary.findMany).toHaveBeenCalledWith({
      where: { title: { contains: 'wolf', mode: 'insensitive' } },
      orderBy: { title: 'asc' },
      take: 10,
      skip: 0,
    });
  });
});

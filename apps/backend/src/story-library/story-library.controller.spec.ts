import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StoryLibraryController } from './story-library.controller';
import { StoryLibraryService } from './story-library.service';
import { PrismaService } from '../prisma.service';

describe('StoryLibraryController', () => {
  let controller: StoryLibraryController;

  const mockStoryLibraryService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoryLibraryController],
      providers: [
        { provide: StoryLibraryService, useValue: mockStoryLibraryService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: PrismaService,
          useValue: {
            client: {
              user: { upsert: jest.fn() },
              storyLibrary: {
                findMany: jest.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    controller = module.get(StoryLibraryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BookProcessor } from './book.processor';
import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';
import { Job } from 'bullmq';
import { BookStatus } from '@repo/database';

describe('BookProcessor', () => {
  let processor: BookProcessor;
  let prisma: PrismaService;
  let aiService: AiService;

  const mockPrismaClient = {
    book: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    page: {
      create: jest.fn(),
    },
    illustration: {
      create: jest.fn(),
    },
  };

  const mockPrismaService = {
    client: mockPrismaClient,
  };

  const mockAiService = {
    generateStory: jest.fn(),
    generateImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    processor = module.get<BookProcessor>(BookProcessor);
    prisma = module.get<PrismaService>(PrismaService);
    aiService = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should process book generation correctly', async () => {
    const bookId = 'test-book-id';
    const mockBook = {
      id: bookId,
      title: 'Test Book',
      style: 'MANGA',
      child: {
        name: 'Alice',
        age: 5,
        interests: 'dinosaurs',
      },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: Content 1\nPage 2: Content 2\nPage 3: Content 3');
    mockPrismaClient.page.create.mockImplementation(({ data }) => Promise.resolve({ id: `page-${data.pageNumber}`, ...data }));

    const job = {
      data: { bookId },
    } as Job;

    await processor.process(job);

    expect(prisma.client.book.findUnique).toHaveBeenCalledWith({
      where: { id: bookId },
      include: { child: true },
    });

    expect(aiService.generateStory).toHaveBeenCalled();
    
    // Check if pages were created
    expect(prisma.client.page.create).toHaveBeenCalledTimes(3);
    
    // Check if book status was updated to REVIEW
    expect(prisma.client.book.update).toHaveBeenCalledWith({
      where: { id: bookId },
      data: { status: BookStatus.REVIEW },
    });
  });

  it('should use manga style prompt prefix when style is MANGA', async () => {
    const bookId = 'manga-book-id';
    const mockBook = {
      id: bookId,
      title: 'Manga Book',
      style: 'MANGA',
      child: {
        name: 'Bob',
        age: 7,
        interests: 'robots',
      },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: Robots fighting');
    mockPrismaClient.page.create.mockResolvedValue({ id: 'page-1' });

    const job = {
      data: { bookId },
    } as Job;

    await processor.process(job);

    expect(prisma.client.illustration.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          prompt: expect.stringContaining('Manga style, high contrast, black and white'),
        }),
      }),
    );
  });
});

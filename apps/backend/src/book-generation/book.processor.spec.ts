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
    book: { findUnique: jest.fn(), update: jest.fn() },
    page: { create: jest.fn() },
    illustration: { create: jest.fn() },
  };

  const mockPrismaService = { client: mockPrismaClient };
  const mockAiService = {
    generateStory: jest.fn(),
    generateImage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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
      style: 'WATERCOLOR',
      child: { name: 'Alice', age: 5, interests: ['dinosaurs'] },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: Content 1\nPage 2: Content 2\nPage 3: Content 3');
    mockAiService.generateImage.mockResolvedValue('https://example.com/image.jpg');
    mockPrismaClient.page.create.mockImplementation(({ data }) => Promise.resolve({ id: `page-${data.pageNumber}`, ...data }));

    const job = { data: { bookId } } as Job;
    await processor.process(job);

    expect(aiService.generateStory).toHaveBeenCalled();
    expect(aiService.generateImage).toHaveBeenCalledTimes(3);
    expect(prisma.client.page.create).toHaveBeenCalledTimes(3);
    expect(prisma.client.book.update).toHaveBeenCalledWith({
      where: { id: bookId },
      data: { status: BookStatus.REVIEW },
    });
  });

  it('should generate 2 illustrations per page when style is MANGA', async () => {
    const bookId = 'manga-book-id';
    const mockBook = {
      id: bookId,
      title: 'Manga Book',
      style: 'MANGA',
      child: { name: 'Bob', age: 7, interests: ['robots'] },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: Robots fighting');
    mockAiService.generateImage.mockResolvedValue('https://example.com/manga-image.jpg');
    mockPrismaClient.page.create.mockResolvedValue({ id: 'page-1' });

    const job = { data: { bookId } } as Job;
    await processor.process(job);

    expect(aiService.generateImage).toHaveBeenCalledTimes(2);
    expect(prisma.client.illustration.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          prompt: expect.stringContaining('Manga style, high contrast, black and white'),
        }),
      }),
    );
  });

  it('should include tone and parentComments in story prompt', async () => {
    const bookId = 'tone-book-id';
    const mockBook = {
      id: bookId,
      title: 'Tone Test',
      style: 'CARTOON',
      tone: 'PLAYFUL',
      parentComments: 'Make it very funny',
      child: { name: 'Charlie', age: 4, gender: 'male', interests: ['dogs'] },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: Fun content');
    mockAiService.generateImage.mockResolvedValue('https://example.com/img.jpg');
    mockPrismaClient.page.create.mockResolvedValue({ id: 'page-1' });

    const job = { data: { bookId } } as Job;
    await processor.process(job);

    expect(aiService.generateStory).toHaveBeenCalledWith(
      expect.stringContaining('playful')
    );
    expect(aiService.generateStory).toHaveBeenCalledWith(
      expect.stringContaining('Make it very funny')
    );
  });

  it('should inject parentFeedback when regenerating', async () => {
    const bookId = 'regen-book-id';
    const mockBook = {
      id: bookId,
      title: 'Regen Test',
      style: 'CARTOON',
      child: { name: 'Dana', age: 6, gender: 'female', interests: ['cats'] },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: New content');
    mockAiService.generateImage.mockResolvedValue('https://example.com/img.jpg');
    mockPrismaClient.page.create.mockResolvedValue({ id: 'page-1' });

    const job = { data: { bookId, parentFeedback: 'Make the ending happier' } } as Job;
    await processor.process(job);

    expect(aiService.generateStory).toHaveBeenCalledWith(
      expect.stringContaining('Make the ending happier')
    );
  });
});

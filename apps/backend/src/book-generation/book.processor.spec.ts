import { Test, type TestingModule } from '@nestjs/testing';
import { BookProcessor } from './book.processor';
import { PromptBuilderService } from './prompt-builder.service';
import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';
import type { Job } from 'bullmq';
import { BookStatus, ReasoningEffort } from '@repo/database';

const makeBook = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-book-id',
  title: 'Test Book',
  status: BookStatus.GENERATING,
  style: 'WATERCOLOR',
  llmModel: 'provider:model-mini',
  reasoningEffort: ReasoningEffort.MEDIUM,
  child: { name: 'Alice', age: 5, gender: 'female', interests: ['dinosaurs'] },
  ...overrides,
});

describe('BookProcessor', () => {
  let processor: BookProcessor;
  let prisma: PrismaService;
  let aiService: AiService;

  const mockPrismaClient = {
    book: { findUnique: jest.fn(), update: jest.fn() },
    page: { create: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockPrismaService = { client: mockPrismaClient };
  const mockAiService = {
    generateStory: jest.fn(),
  };
  const mockPromptBuilder = {
    buildPrompt: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaClient.$transaction.mockImplementation(async (callback) =>
      callback({
        book: { update: mockPrismaClient.book.update },
        page: {
          create: mockPrismaClient.page.create,
          deleteMany: mockPrismaClient.page.deleteMany,
        },
      })
    );
    mockPromptBuilder.buildPrompt.mockReturnValue('test prompt');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AiService, useValue: mockAiService },
        { provide: PromptBuilderService, useValue: mockPromptBuilder },
      ],
    }).compile();

    processor = module.get<BookProcessor>(BookProcessor);
    prisma = module.get<PrismaService>(PrismaService);
    aiService = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('replaces pages atomically and moves the book to review', async () => {
    const bookId = 'test-book-id';
    const mockBook = makeBook({ id: bookId });

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue(
      'Page 1: Content 1\nPage 2: Content 2\nPage 3: Content 3'
    );

    const job = { data: { bookId } } as Job;
    await processor.process(job);

    expect(mockPromptBuilder.buildPrompt).toHaveBeenCalledWith(mockBook, undefined);
    expect(aiService.generateStory).toHaveBeenCalledWith('test prompt', {
      model: 'provider:model-mini',
      reasoningEffort: ReasoningEffort.MEDIUM,
    });
    expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrismaClient.page.deleteMany).toHaveBeenCalledWith({ where: { bookId } });
    expect(mockPrismaClient.page.create).toHaveBeenCalledTimes(3);
    expect(mockPrismaClient.page.create).toHaveBeenNthCalledWith(1, {
      data: {
        bookId,
        pageNumber: 1,
        textContent: 'Content 1',
      },
    });
    expect(prisma.client.book.update).toHaveBeenCalledWith({
      where: { id: bookId },
      data: { status: BookStatus.REVIEW },
    });
  });

  it('includes tone and parentComments in the prompt', async () => {
    const bookId = 'tone-book-id';
    const mockBook = makeBook({
      id: bookId,
      title: 'Tone Test',
      style: 'CARTOON',
      tone: 'PLAYFUL',
      parentComments: 'Make it very funny',
      llmModel: 'provider:model-standard',
      reasoningEffort: ReasoningEffort.HIGH,
      child: { name: 'Charlie', age: 4, gender: 'male', interests: ['dogs'] },
    });

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: Fun content\nPage 2: More fun content');

    await processor.process({ data: { bookId } } as Job);

    expect(mockPromptBuilder.buildPrompt).toHaveBeenCalledWith(mockBook, undefined);
    expect(aiService.generateStory).toHaveBeenCalledWith(
      'test prompt',
      expect.objectContaining({
        model: 'provider:model-standard',
        reasoningEffort: ReasoningEffort.HIGH,
      })
    );
  });

  it('handles a book whose child profile was deleted', async () => {
    const bookId = 'no-child-book-id';
    const mockBook = makeBook({ id: bookId, child: null });

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: One\nPage 2: Two');

    await processor.process({ data: { bookId } } as Job);

    expect(mockPromptBuilder.buildPrompt).toHaveBeenCalledWith(mockBook, undefined);
  });

  it('injects parentFeedback when regenerating', async () => {
    const bookId = 'regen-book-id';
    const mockBook = makeBook({ id: bookId, llmModel: 'provider:model-nano' });

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: New content\nPage 2: Updated content');

    const parentFeedback = 'Make the ending happier';
    await processor.process({ data: { bookId, parentFeedback } } as Job);

    expect(mockPromptBuilder.buildPrompt).toHaveBeenCalledWith(mockBook, parentFeedback);
  });

  it('marks the book as failed and rethrows when story generation fails', async () => {
    const bookId = 'failed-book-id';
    const error = new Error('provider unavailable');

    mockPrismaClient.book.findUnique.mockResolvedValue(makeBook({ id: bookId }));
    mockAiService.generateStory.mockRejectedValue(error);

    await expect(processor.process({ data: { bookId } } as Job)).rejects.toThrow(error);

    expect(prisma.client.book.update).toHaveBeenCalledWith({
      where: { id: bookId },
      data: { status: BookStatus.FAILED },
    });
    expect(mockPrismaClient.page.create).not.toHaveBeenCalled();
  });

  it('marks the book as failed when page parsing fails', async () => {
    const bookId = 'parse-book-id';

    mockPrismaClient.book.findUnique.mockResolvedValue(makeBook({ id: bookId }));
    mockAiService.generateStory.mockResolvedValue('Only one paragraph without page markers.');

    await expect(processor.process({ data: { bookId } } as Job)).rejects.toThrow(
      /Failed to parse story/
    );

    expect(mockPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(prisma.client.book.update).toHaveBeenCalledWith({
      where: { id: bookId },
      data: { status: BookStatus.FAILED },
    });
  });

  it('ignores jobs for books that are no longer generating', async () => {
    const bookId = 'review-book-id';

    mockPrismaClient.book.findUnique.mockResolvedValue(
      makeBook({ id: bookId, status: BookStatus.REVIEW })
    );

    await expect(processor.process({ data: { bookId } } as Job)).rejects.toThrow(/not GENERATING/);

    expect(mockAiService.generateStory).not.toHaveBeenCalled();
    expect(prisma.client.book.update).not.toHaveBeenCalled();
  });

  it('throws when the book is not found', async () => {
    mockPrismaClient.book.findUnique.mockResolvedValue(null);

    await expect(processor.process({ data: { bookId: 'missing-book' } } as Job)).rejects.toThrow(
      'Book with id missing-book not found'
    );

    expect(mockPrismaClient.book.update).not.toHaveBeenCalled();
  });
});

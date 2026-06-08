import { Test, TestingModule } from '@nestjs/testing';
import { BookProcessor } from './book.processor';
import { PromptBuilderService } from './prompt-builder.service';
import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';
import { Job } from 'bullmq';
import { BookStatus, ReasoningEffort } from '@repo/database';

describe('BookProcessor', () => {
  let processor: BookProcessor;
  let prisma: PrismaService;
  let aiService: AiService;

  const mockPrismaClient = {
    book: { findUnique: jest.fn(), update: jest.fn() },
    storyLibrary: { findUnique: jest.fn() },
    page: { create: jest.fn() },
    illustration: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockPrismaService = { client: mockPrismaClient };
  const mockAiService = {
    generateStory: jest.fn(),
    generateImage: jest.fn(),
  };
  const mockPromptBuilder = {
    buildPrompt: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaClient.$transaction.mockImplementation(async (callback) =>
      callback(mockPrismaClient)
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

  it('should process book generation correctly', async () => {
    const bookId = 'test-book-id';
    const mockBook = {
      id: bookId,
      title: 'Test Book',
      style: 'WATERCOLOR',
      llmModel: 'provider:model-mini',
      reasoningEffort: ReasoningEffort.MEDIUM,
      child: { name: 'Alice', age: 5, gender: 'female', interests: ['dinosaurs'] },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue(
      'Page 1: Content 1\nPage 2: Content 2\nPage 3: Content 3'
    );
    mockPrismaClient.page.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: `page-${data.pageNumber}`, ...data })
    );

    const job = { data: { bookId } } as Job;
    await processor.process(job);

    expect(prisma.client.book.update).toHaveBeenNthCalledWith(1, {
      where: { id: bookId },
      data: { status: BookStatus.GENERATING },
    });
    expect(mockPromptBuilder.buildPrompt).toHaveBeenCalledWith(mockBook, undefined);
    expect(aiService.generateStory).toHaveBeenCalledWith('test prompt', {
      model: 'provider:model-mini',
      reasoningEffort: ReasoningEffort.MEDIUM,
    });
    expect(prisma.client.page.create).toHaveBeenCalledTimes(3);
    expect(prisma.client.page.create).toHaveBeenNthCalledWith(1, {
      data: {
        bookId,
        pageNumber: 1,
        textContent: 'Content 1',
      },
    });
    expect(prisma.client.page.create).toHaveBeenNthCalledWith(2, {
      data: {
        bookId,
        pageNumber: 2,
        textContent: 'Content 2',
      },
    });
    expect(prisma.client.page.create).toHaveBeenNthCalledWith(3, {
      data: {
        bookId,
        pageNumber: 3,
        textContent: 'Content 3',
      },
    });
    expect(prisma.client.book.update).toHaveBeenNthCalledWith(2, {
      where: { id: bookId },
      data: { status: BookStatus.REVIEW },
    });
  });

  it('should include tone and parentComments in story prompt', async () => {
    const bookId = 'tone-book-id';
    const mockBook = {
      id: bookId,
      title: 'Tone Test',
      style: 'CARTOON',
      tone: 'PLAYFUL',
      parentComments: 'Make it very funny',
      llmModel: 'provider:model-standard',
      reasoningEffort: ReasoningEffort.HIGH,
      child: { name: 'Charlie', age: 4, gender: 'male', interests: ['dogs'] },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: Fun content\nPage 2: More fun content');
    mockPrismaClient.page.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: `page-${data.pageNumber}`, ...data })
    );

    const job = { data: { bookId } } as Job;
    await processor.process(job);

    expect(mockPromptBuilder.buildPrompt).toHaveBeenCalledWith(mockBook, undefined);
    expect(aiService.generateStory).toHaveBeenCalledWith(
      'test prompt',
      expect.objectContaining({
        model: 'provider:model-standard',
        reasoningEffort: ReasoningEffort.HIGH,
      })
    );
  });

  it('should inject parentFeedback when regenerating', async () => {
    const bookId = 'regen-book-id';
    const mockBook = {
      id: bookId,
      title: 'Regen Test',
      style: 'CARTOON',
      llmModel: 'provider:model-nano',
      reasoningEffort: ReasoningEffort.LOW,
      child: { name: 'Dana', age: 6, gender: 'female', interests: ['cats'] },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: New content\nPage 2: Updated content');
    mockPrismaClient.page.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: `page-${data.pageNumber}`, ...data })
    );

    const parentFeedback = 'Make the ending happier';
    const job = { data: { bookId, parentFeedback } } as Job;
    await processor.process(job);

    expect(mockPromptBuilder.buildPrompt).toHaveBeenCalledWith(mockBook, parentFeedback);
    expect(aiService.generateStory).toHaveBeenCalledWith('test prompt', {
      model: 'provider:model-nano',
      reasoningEffort: ReasoningEffort.LOW,
    });
  });

  it('should mark the book as failed and rethrow when story generation fails', async () => {
    const bookId = 'failed-book-id';
    const error = new Error('provider unavailable');
    const mockBook = {
      id: bookId,
      title: 'Failure Test',
      style: 'CARTOON',
      llmModel: 'provider:model-mini',
      reasoningEffort: ReasoningEffort.MEDIUM,
      child: { name: 'Eve', age: 8, gender: 'female', interests: ['space'] },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockRejectedValue(error);

    const job = { data: { bookId } } as Job;

    await expect(processor.process(job)).rejects.toThrow(error);

    expect(prisma.client.book.update).toHaveBeenNthCalledWith(1, {
      where: { id: bookId },
      data: { status: BookStatus.GENERATING },
    });
    expect(prisma.client.book.update).toHaveBeenNthCalledWith(2, {
      where: { id: bookId },
      data: { status: BookStatus.FAILED },
    });
    expect(prisma.client.page.create).not.toHaveBeenCalled();
  });

  it('should roll back page writes and mark the book as failed when review transition fails', async () => {
    const bookId = 'rollback-book-id';
    const error = new Error('review update failed');
    const mockBook = {
      id: bookId,
      title: 'Rollback Test',
      style: 'CARTOON',
      llmModel: 'provider:model-mini',
      reasoningEffort: ReasoningEffort.MEDIUM,
      child: { name: 'Finn', age: 7, gender: 'male', interests: ['dragons'] },
    };
    const createdPages: Array<{ bookId: string; pageNumber: number; textContent: string }> = [];
    const txPageCreate = jest.fn(async ({ data }) => {
      createdPages.push(data);
      return { id: `page-${data.pageNumber}`, ...data };
    });
    const txBookUpdate = jest.fn(async ({ data }) => {
      if (data.status === BookStatus.REVIEW) {
        throw error;
      }

      return { id: bookId, ...data };
    });

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: Content 1\nPage 2: Content 2');
    mockPrismaClient.$transaction.mockImplementation(async (callback) => {
      try {
        return await callback({
          book: { update: txBookUpdate },
          page: { create: txPageCreate },
        });
      } catch (transactionError) {
        createdPages.length = 0;
        throw transactionError;
      }
    });

    const job = { data: { bookId } } as Job;

    await expect(processor.process(job)).rejects.toThrow(error);

    expect(txPageCreate).toHaveBeenCalledTimes(2);
    expect(txBookUpdate).toHaveBeenCalledWith({
      where: { id: bookId },
      data: { status: BookStatus.REVIEW },
    });
    expect(createdPages).toEqual([]);
    expect(prisma.client.book.update).toHaveBeenNthCalledWith(1, {
      where: { id: bookId },
      data: { status: BookStatus.GENERATING },
    });
    expect(prisma.client.book.update).toHaveBeenNthCalledWith(2, {
      where: { id: bookId },
      data: { status: BookStatus.FAILED },
    });
  });

  it('should throw when book is not found', async () => {
    mockPrismaClient.book.findUnique.mockResolvedValue(null);

    const job = { data: { bookId: 'missing-book' } } as Job;
    await expect(processor.process(job)).rejects.toThrow('Book with id missing-book not found');

    expect(mockPrismaClient.book.update).not.toHaveBeenCalled();
  });
});

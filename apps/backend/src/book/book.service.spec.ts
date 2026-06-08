import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { PrismaService } from '../prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { BookStatus, ReasoningEffort } from '@repo/database';
import { Queue } from 'bullmq';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('BookService', () => {
  let service: BookService;
  let prisma: any;
  let pdfService: PdfService;
  let storageService: StorageService;
  let queue: Queue;
  let configService: ConfigService;

  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
    },
    book: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    page: {
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockPrismaService = { client: mockPrismaClient };
  const mockPdfService = { generateBookPdf: jest.fn() };
  const mockStorageService = { upload: jest.fn() };
  const mockQueue = { add: jest.fn(), waitUntilReady: jest.fn() };
  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockQueue.waitUntilReady.mockResolvedValue(undefined);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PdfService, useValue: mockPdfService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: 'BullQueue_book-generation', useValue: mockQueue },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
    prisma = module.get<PrismaService>(PrismaService);
    pdfService = module.get<PdfService>(PdfService);
    storageService = module.get<StorageService>(StorageService);
    queue = module.get<Queue>('BullQueue_book-generation');
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const books = [
        { id: '1', title: 'Test', child: { name: 'Alice' }, pages: [], createdAt: new Date() },
      ];
      mockPrismaClient.book.findMany.mockResolvedValue(books);
      mockPrismaClient.book.count.mockResolvedValue(1);
      mockPrismaClient.book.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.findAll({ skip: 0, take: 10, where: {} });
      expect(mockPrismaClient.book.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: BookStatus.GENERATING,
          }),
          data: { status: BookStatus.FAILED },
        })
      );
      expect(result).toEqual({ books, total: 1, page: 1, totalPages: 1 });
    });
  });

  describe('createAndGenerate', () => {
    it('should create book and enqueue job', async () => {
      const dto = { childId: 'c1', type: 'AI_ADAPTED' as const, style: 'cartoon' };
      const createdBook = { id: 'book-1' };
      mockPrismaClient.book.create.mockResolvedValue(createdBook);

      const result = await service.createAndGenerate(dto, 'user-1');
      expect(prisma.client.book.create).toHaveBeenCalled();
      expect(mockQueue.waitUntilReady).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith('generate-book', { bookId: 'book-1' });
      expect(result).toEqual({ bookId: 'book-1', status: 'GENERATING' });
      expect(prisma.client.book.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ style: 'CARTOON' }),
        })
      );
    });

    it('stores the user generation defaults on a newly created book', async () => {
      const dto = {
        childId: 'child-1',
        type: 'AI_ADAPTED' as const,
        storyTitle: 'Cinderella',
        style: 'watercolor',
        tone: 'playful',
      };
      const userId = 'user-1';

      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: userId,
        preferredReasoningEffort: ReasoningEffort.HIGH,
      });
      mockConfigService.getOrThrow.mockReturnValue('openai:gpt-5.4.1');
      mockPrismaClient.book.create.mockResolvedValue({ id: 'book-1' });
      mockQueue.add.mockResolvedValue(undefined);

      await service.createAndGenerate(dto, userId);

      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('LLM_MODEL_NAME');
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
        })
      );

      expect(mockPrismaClient.book.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            llmModel: 'openai:gpt-5.4.1',
            reasoningEffort: ReasoningEffort.HIGH,
            style: 'WATERCOLOR',
            tone: 'PLAYFUL',
          }),
        })
      );
    });

    it('fails fast when the generation queue is unavailable', async () => {
      const dto = {
        childId: 'child-1',
        type: 'AI_ADAPTED' as const,
        storyTitle: 'Cinderella',
        style: 'watercolor',
      };

      mockQueue.waitUntilReady.mockRejectedValue(new Error('redis down'));

      await expect(service.createAndGenerate(dto, 'user-1')).rejects.toThrow(
        ServiceUnavailableException
      );
      expect(mockPrismaClient.book.create).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('falls back to built-in defaults when user settings are unavailable', async () => {
      const dto = {
        childId: 'child-1',
        type: 'AI_ADAPTED' as const,
        storyTitle: 'Cinderella',
        style: 'watercolor',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockConfigService.getOrThrow.mockReturnValue('openai:gpt-5.4.1');
      mockPrismaClient.book.create.mockResolvedValue({ id: 'book-1' });
      mockQueue.add.mockResolvedValue(undefined);

      await service.createAndGenerate(dto, 'user-1');

      expect(mockPrismaClient.book.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            llmModel: 'openai:gpt-5.4.1',
            reasoningEffort: ReasoningEffort.MEDIUM,
            style: 'WATERCOLOR',
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('returns an owner-scoped book detail payload', async () => {
      const mockBook = {
        id: 'book-1',
        status: BookStatus.GENERATING,
        child: { id: 'child-1', name: 'Alice', age: 7 },
        pages: [],
      };
      mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);

      const result = await service.getById('book-1', 'user-1');

      expect(mockPrismaClient.book.findUnique).toHaveBeenCalledWith({
        where: { id: 'book-1', userId: 'user-1' },
        include: {
          child: { select: { id: true, name: true, age: true } },
          pages: { orderBy: { pageNumber: 'asc' } },
        },
      });
      expect(result).toBe(mockBook);
    });

    it('throws when the scoped book does not exist', async () => {
      mockPrismaClient.book.findUnique.mockResolvedValue(null);

      await expect(service.getById('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPreview', () => {
    it('should return book with pages for REVIEW status', async () => {
      const mockBook = { id: 'b1', status: BookStatus.REVIEW, pages: [] };
      mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);

      const result = await service.getPreview('b1', 'user-1');
      expect(result).toEqual({ book: mockBook });
    });

    it('should throw for DRAFT status', async () => {
      mockPrismaClient.book.findUnique.mockResolvedValue({ id: 'b1', status: BookStatus.DRAFT });
      await expect(service.getPreview('b1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should return pdfUrl for COMPLETED status', async () => {
      const mockBook = {
        id: 'b1',
        status: BookStatus.COMPLETED,
        pdfUrl: 'https://s3.com/book.pdf',
        pages: [],
      };
      mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);

      const result = await service.getPreview('b1', 'user-1');
      expect(result).toEqual({
        book: mockBook,
        pdfUrl: 'https://s3.com/book.pdf',
        redirectToDetail: true,
      });
    });
  });

  describe('approveBook', () => {
    it('should mark a review book as completed without generating pdf', async () => {
      const mockBook = {
        id: 'b1',
        status: BookStatus.REVIEW,
      };
      mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);

      const result = await service.approveBook('b1', 'user-1');
      expect(pdfService.generateBookPdf).not.toHaveBeenCalled();
      expect(storageService.upload).not.toHaveBeenCalled();
      expect(prisma.client.book.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: expect.objectContaining({
          status: BookStatus.COMPLETED,
          approvedAt: expect.any(Date),
        }),
      });
      expect(result).toEqual({ status: BookStatus.COMPLETED });
    });
  });

  describe('regenerate', () => {
    it('should delete pages and enqueue new job', async () => {
      mockPrismaClient.book.findUnique.mockResolvedValue({ id: 'b1', userId: 'user-1' });
      mockQueue.waitUntilReady.mockResolvedValue(undefined);
      const result = await service.regenerate(
        'b1',
        { parentFeedback: 'Make it funnier' },
        'user-1'
      );
      expect(prisma.client.page.deleteMany).toHaveBeenCalledWith({ where: { bookId: 'b1' } });
      expect(mockQueue.waitUntilReady).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith('generate-book', {
        bookId: 'b1',
        parentFeedback: 'Make it funnier',
      });
      expect(result).toEqual({ bookId: 'b1', status: 'REGENERATING' });
    });
  });
});

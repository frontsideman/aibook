import { Test, type TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { PrismaService } from '../prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { BookStatus, ReasoningEffort } from '@repo/database';
import type { Queue } from 'bullmq';
import { ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('BookService', () => {
  let service: BookService;
  let prisma: PrismaService;
  let _queue: Queue;
  let _configService: ConfigService;

  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
    },
    childProfile: {
      findFirst: jest.fn(),
    },
    book: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    page: {
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockPrismaService = { client: mockPrismaClient };
  const mockPdfService = { generateBookPdf: jest.fn() };
  const mockStorageService = {
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
  };
  const mockQueue = { add: jest.fn(), waitUntilReady: jest.fn() };
  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockQueue.waitUntilReady.mockResolvedValue(undefined);
    mockQueue.add.mockResolvedValue(undefined);
    mockConfigService.getOrThrow.mockReturnValue('openai:env-model');
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: 'user-1',
      preferredReasoningEffort: ReasoningEffort.MEDIUM,
    });
    mockPrismaClient.childProfile.findFirst.mockResolvedValue({ id: 'child-1' });
    mockPrismaClient.book.create.mockResolvedValue({ id: 'book-1' });
    mockPrismaClient.book.update.mockResolvedValue({});
    mockPrismaClient.book.updateMany.mockResolvedValue({ count: 1 });
    mockStorageService.getPublicUrl.mockReturnValue(
      'http://localhost:9000/aibook/books/book-1/book.pdf'
    );

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
    _queue = module.get<Queue>('BullQueue_book-generation');
    _configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns paginated results and scopes the stale sweep by user', async () => {
      const books = [
        { id: '1', title: 'Test', child: { name: 'Alice' }, pages: [], createdAt: new Date() },
      ];
      mockPrismaClient.book.findMany.mockResolvedValue(books);
      mockPrismaClient.book.count.mockResolvedValue(1);
      mockPrismaClient.book.groupBy.mockResolvedValue([
        { status: BookStatus.REVIEW, _count: { _all: 1 } },
      ]);

      const result = await service.findAll({ skip: 0, take: 10, where: { userId: 'user-1' } });

      expect(mockPrismaClient.book.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: BookStatus.GENERATING,
            userId: 'user-1',
          }),
          data: { status: BookStatus.FAILED },
        })
      );
      expect(mockPrismaClient.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { updatedAt: 'desc' } })
      );
      expect(mockPrismaClient.book.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['status'],
          where: { userId: 'user-1' },
        })
      );
      expect(result).toEqual({
        books,
        total: 1,
        page: 1,
        totalPages: 1,
        statusCounts: { REVIEW: 1 },
      });
    });

    it('sorts by title when requested', async () => {
      mockPrismaClient.book.findMany.mockResolvedValue([]);
      mockPrismaClient.book.count.mockResolvedValue(0);
      mockPrismaClient.book.groupBy.mockResolvedValue([]);

      await service.findAll({ skip: 0, take: 10, where: { userId: 'user-1' }, sort: 'title' });

      expect(mockPrismaClient.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { title: 'asc' } })
      );
    });
  });

  describe('createAndGenerate', () => {
    it('creates a book for the owner and enqueues a job', async () => {
      const dto = { childId: 'child-1', type: 'AI_ADAPTED' as const, style: 'cartoon' };

      const result = await service.createAndGenerate(dto, 'user-1');

      expect(mockPrismaClient.childProfile.findFirst).toHaveBeenCalledWith({
        where: { id: 'child-1', userId: 'user-1' },
        select: { id: true },
      });
      expect(mockQueue.waitUntilReady).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith('generate-book', { bookId: 'book-1' });
      expect(result).toEqual({ bookId: 'book-1', status: 'GENERATING' });
      expect(prisma.client.book.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ style: 'CARTOON', userId: 'user-1', childId: 'child-1' }),
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

      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'user-1',
        preferredReasoningEffort: ReasoningEffort.HIGH,
      });

      await service.createAndGenerate(dto, 'user-1');

      expect(mockPrismaClient.book.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            llmModel: 'openai:env-model',
            reasoningEffort: ReasoningEffort.HIGH,
            style: 'WATERCOLOR',
            tone: 'PLAYFUL',
          }),
        })
      );
    });

    it('rejects a childId owned by another user', async () => {
      mockPrismaClient.childProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.createAndGenerate(
          { childId: 'foreign-child', type: 'AI_ADAPTED', style: 'cartoon' },
          'user-1'
        )
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaClient.book.create).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('rejects an invalid style', async () => {
      await expect(
        service.createAndGenerate(
          { childId: 'child-1', type: 'AI_ADAPTED', style: 'oil-painting' },
          'user-1'
        )
      ).rejects.toThrow('Invalid book style');
    });

    it('fails fast when the generation queue is unavailable', async () => {
      mockQueue.waitUntilReady.mockRejectedValue(new Error('redis down'));

      await expect(
        service.createAndGenerate(
          { childId: 'child-1', type: 'AI_ADAPTED', style: 'watercolor' },
          'user-1'
        )
      ).rejects.toThrow(ServiceUnavailableException);
      expect(mockPrismaClient.book.create).not.toHaveBeenCalled();
    });

    it('marks the book as failed when enqueueing fails after creation', async () => {
      mockQueue.add.mockRejectedValue(new Error('redis down'));

      await expect(
        service.createAndGenerate(
          { childId: 'child-1', type: 'AI_ADAPTED', style: 'watercolor' },
          'user-1'
        )
      ).rejects.toThrow(ServiceUnavailableException);

      expect(mockPrismaClient.book.update).toHaveBeenCalledWith({
        where: { id: 'book-1' },
        data: { status: BookStatus.FAILED },
      });
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
      mockPrismaClient.book.findFirst.mockResolvedValue(mockBook);

      const result = await service.getById('book-1', 'user-1');

      expect(mockPrismaClient.book.findFirst).toHaveBeenCalledWith({
        where: { id: 'book-1', userId: 'user-1' },
        include: {
          child: { select: { id: true, name: true, age: true } },
          pages: { orderBy: { pageNumber: 'asc' } },
        },
      });
      expect(result).toBe(mockBook);
    });

    it('throws when the scoped book does not exist', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue(null);

      await expect(service.getById('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPreview', () => {
    it('returns preview data for REVIEW status', async () => {
      const mockBook = { id: 'b1', status: BookStatus.REVIEW, pages: [] };
      mockPrismaClient.book.findFirst.mockResolvedValue(mockBook);

      await expect(service.getPreview('b1', 'user-1')).resolves.toEqual({ book: mockBook });
    });

    it('rejects drafts and failed books', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue({
        id: 'b1',
        status: BookStatus.DRAFT,
        pages: [],
      });

      await expect(service.getPreview('b1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('returns pdfUrl for COMPLETED status', async () => {
      const mockBook = {
        id: 'b1',
        status: BookStatus.COMPLETED,
        pdfUrl: 'https://s3.com/book.pdf',
        pages: [],
      };
      mockPrismaClient.book.findFirst.mockResolvedValue(mockBook);

      const result = await service.getPreview('b1', 'user-1');
      expect(result).toEqual({
        book: mockBook,
        pdfUrl: 'https://s3.com/book.pdf',
        redirectToDetail: true,
      });
    });
  });

  describe('approveBook', () => {
    it('atomically marks a review book as completed', async () => {
      const result = await service.approveBook('b1', 'user-1');

      expect(mockPrismaClient.book.updateMany).toHaveBeenCalledWith({
        where: { id: 'b1', userId: 'user-1', status: BookStatus.REVIEW },
        data: expect.objectContaining({
          status: BookStatus.COMPLETED,
          approvedAt: expect.any(Date),
        }),
      });
      expect(result).toEqual({ status: BookStatus.COMPLETED });
    });

    it('returns not found for a foreign book', async () => {
      mockPrismaClient.book.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaClient.book.findFirst.mockResolvedValue(null);

      await expect(service.approveBook('b1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns conflict when the book is not in review', async () => {
      mockPrismaClient.book.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaClient.book.findFirst.mockResolvedValue({
        id: 'b1',
        status: BookStatus.COMPLETED,
      });

      await expect(service.approveBook('b1', 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('editPage', () => {
    it('throws when the book is not owned by the user', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue(null);

      await expect(service.editPage('b1', 1, { feedback: 'Change it' }, 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(mockPrismaClient.page.findUnique).not.toHaveBeenCalled();
    });

    it('appends parent feedback to the page text', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue({
        id: 'b1',
        status: BookStatus.REVIEW,
      });
      mockPrismaClient.page.findUnique.mockResolvedValue({
        id: 'p1',
        textContent: 'Original',
      });
      mockPrismaClient.page.update.mockResolvedValue({ id: 'p1' });

      await service.editPage('b1', 1, { feedback: 'Make it warmer' }, 'user-1');

      expect(mockPrismaClient.page.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { textContent: 'Original\n\n[Parent edit: Make it warmer]' },
        include: { illustrations: true },
      });
    });

    it('rejects page edits outside the review stage', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue({
        id: 'b1',
        status: BookStatus.COMPLETED,
      });

      await expect(service.editPage('b1', 1, { feedback: 'Change it' }, 'user-1')).rejects.toThrow(
        ConflictException
      );
      expect(mockPrismaClient.page.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('regenerate', () => {
    it('sets GENERATING, keeps pages, and enqueues a new job', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue({
        id: 'b1',
        status: BookStatus.REVIEW,
      });

      const result = await service.regenerate(
        'b1',
        { parentFeedback: 'Make it funnier' },
        'user-1'
      );

      expect(mockPrismaClient.book.updateMany).toHaveBeenCalledWith({
        where: { id: 'b1', userId: 'user-1', status: BookStatus.REVIEW },
        data: { status: BookStatus.GENERATING, parentFeedback: 'Make it funnier' },
      });
      expect(mockPrismaClient.page.deleteMany).not.toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith('generate-book', {
        bookId: 'b1',
        parentFeedback: 'Make it funnier',
      });
      expect(result).toEqual({ bookId: 'b1', status: 'REGENERATING' });
    });

    it('allows retrying a failed book without feedback', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue({
        id: 'b1',
        status: BookStatus.FAILED,
      });

      await service.regenerate('b1', {}, 'user-1');

      expect(mockPrismaClient.book.updateMany).toHaveBeenCalledWith({
        where: { id: 'b1', userId: 'user-1', status: BookStatus.FAILED },
        data: { status: BookStatus.GENERATING, parentFeedback: undefined },
      });
    });

    it('rejects regeneration of a completed book', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue({
        id: 'b1',
        status: BookStatus.COMPLETED,
      });

      await expect(service.regenerate('b1', {}, 'user-1')).rejects.toThrow(ConflictException);
    });

    it('restores the previous status when enqueueing fails', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue({
        id: 'b1',
        status: BookStatus.REVIEW,
      });
      mockQueue.add.mockRejectedValue(new Error('redis down'));

      await expect(service.regenerate('b1', {}, 'user-1')).rejects.toThrow(
        ServiceUnavailableException
      );

      expect(mockPrismaClient.book.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { status: BookStatus.REVIEW },
      });
    });
  });

  describe('getPdfUrl', () => {
    it('returns the stored PDF URL', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue({ pdfUrl: 'https://cdn/book.pdf' });

      await expect(service.getPdfUrl('b1', 'user-1')).resolves.toEqual({
        pdfUrl: 'https://cdn/book.pdf',
      });
    });

    it('throws when no PDF has been created', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue({ pdfUrl: null });

      await expect(service.getPdfUrl('b1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPdf', () => {
    const pdfBook = {
      id: 'book-1',
      status: BookStatus.COMPLETED,
      pdfUrl: null,
      pages: [
        {
          id: 'p1',
          pageNumber: 1,
          textContent: 'Once upon a time.',
          illustrations: [],
        },
      ],
    };

    it('creates and stores a PDF for a completed book', async () => {
      const buffer = Buffer.from('pdf');
      mockPrismaClient.book.findFirst.mockResolvedValue(pdfBook);
      mockPdfService.generateBookPdf.mockResolvedValue(buffer);

      const result = await service.createPdf('book-1', 'user-1');

      expect(mockPdfService.generateBookPdf).toHaveBeenCalledWith([
        { text: 'Once upon a time.', imageUrl: undefined },
      ]);
      expect(mockStorageService.upload).toHaveBeenCalledWith(
        'books/book-1/book.pdf',
        buffer,
        'application/pdf'
      );
      expect(mockPrismaClient.book.update).toHaveBeenCalledWith({
        where: { id: 'book-1' },
        data: { pdfUrl: 'http://localhost:9000/aibook/books/book-1/book.pdf' },
      });
      expect(result).toEqual({ pdfUrl: 'http://localhost:9000/aibook/books/book-1/book.pdf' });
    });

    it('returns an existing PDF without regenerating it', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue({
        ...pdfBook,
        pdfUrl: 'https://cdn/existing.pdf',
      });

      await expect(service.createPdf('book-1', 'user-1')).resolves.toEqual({
        pdfUrl: 'https://cdn/existing.pdf',
      });
      expect(mockPdfService.generateBookPdf).not.toHaveBeenCalled();
    });

    it('rejects PDF creation for a non-completed book', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue({
        ...pdfBook,
        status: BookStatus.REVIEW,
      });

      await expect(service.createPdf('book-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('reports storage failures', async () => {
      mockPrismaClient.book.findFirst.mockResolvedValue(pdfBook);
      mockPdfService.generateBookPdf.mockResolvedValue(Buffer.from('pdf'));
      mockStorageService.upload.mockRejectedValue(new Error('minio down'));

      await expect(service.createPdf('book-1', 'user-1')).rejects.toThrow(
        ServiceUnavailableException
      );
    });
  });
});

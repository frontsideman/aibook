import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { PrismaService } from '../prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { BookStatus } from '@repo/database';
import { Queue } from 'bullmq';
import { NotFoundException } from '@nestjs/common';

describe('BookService', () => {
  let service: BookService;
  let prisma: any;
  let pdfService: PdfService;
  let storageService: StorageService;
  let queue: Queue;

  const mockPrismaClient = {
    book: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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
  const mockQueue = { add: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        { provide: PrismaService, useValue: mockPrismaService },
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const books = [{ id: '1', title: 'Test', child: { name: 'Alice' }, pages: [], createdAt: new Date() }];
      mockPrismaClient.book.findMany.mockResolvedValue(books);
      mockPrismaClient.book.count.mockResolvedValue(1);

      const result = await service.findAll({ skip: 0, take: 10, where: {} });
      expect(result).toEqual({ books, total: 1, page: 1, totalPages: 1 });
    });
  });

  describe('createAndGenerate', () => {
    it('should create book and enqueue job', async () => {
      const dto = { childId: 'c1', type: 'AI_ADAPTED' as const, style: 'CARTOON' };
      const createdBook = { id: 'book-1' };
      mockPrismaClient.book.create.mockResolvedValue(createdBook);

      const result = await service.createAndGenerate(dto, 'user-1');
      expect(prisma.client.book.create).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith('generate-book', { bookId: 'book-1' });
      expect(result).toEqual({ bookId: 'book-1', status: 'DRAFT' });
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
      const mockBook = { id: 'b1', status: BookStatus.COMPLETED, pdfUrl: 'https://s3.com/book.pdf', pages: [] };
      mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);

      const result = await service.getPreview('b1', 'user-1');
      expect(result).toEqual({ book: mockBook, pdfUrl: 'https://s3.com/book.pdf', redirectToDetail: true });
    });
  });

  describe('approveBook', () => {
    it('should generate PDF, upload, and update status', async () => {
      const mockBook = {
        id: 'b1',
        status: BookStatus.REVIEW,
        pages: [{ textContent: 'Page 1', illustrations: [{ url: 'img1.jpg' }] }],
      };
      mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
      mockPdfService.generateBookPdf.mockResolvedValue(Buffer.from('pdf'));
      mockStorageService.upload.mockResolvedValue({ key: 'books/b1/book.pdf' });

      const result = await service.approveBook('b1', 'user-1');
      expect(pdfService.generateBookPdf).toHaveBeenCalled();
      expect(storageService.upload).toHaveBeenCalled();
      expect(prisma.client.book.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: expect.objectContaining({ status: BookStatus.COMPLETED }),
      });
      expect(result.pdfUrl).toBeDefined();
    });
  });

  describe('regenerate', () => {
    it('should delete pages and enqueue new job', async () => {
      mockPrismaClient.book.findUnique.mockResolvedValue({ id: 'b1', userId: 'user-1' });
      const result = await service.regenerate('b1', { parentFeedback: 'Make it funnier' }, 'user-1');
      expect(prisma.client.page.deleteMany).toHaveBeenCalledWith({ where: { bookId: 'b1' } });
      expect(mockQueue.add).toHaveBeenCalledWith('generate-book', {
        bookId: 'b1',
        parentFeedback: 'Make it funnier',
      });
      expect(result).toEqual({ bookId: 'b1', status: 'REGENERATING' });
    });
  });
});

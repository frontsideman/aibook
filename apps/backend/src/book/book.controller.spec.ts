import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';

describe('BookController', () => {
  let controller: BookController;
  let service: BookService;

  const mockBookService = {
    findAll: jest.fn(),
    getById: jest.fn(),
    createAndGenerate: jest.fn(),
    getPreview: jest.fn(),
    approveBook: jest.fn(),
    editPage: jest.fn(),
    regenerate: jest.fn(),
    getPdfUrl: jest.fn(),
  };

  const mockPrismaService = {
    client: {
      user: { findUnique: jest.fn() },
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('true'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [
        { provide: BookService, useValue: mockBookService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<BookController>(BookController);
    service = module.get<BookService>(BookService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call bookService.findAll with user-scoped query', async () => {
      const query = { title: 'Test', style: 'CARTOON', page: '1', limit: '10' };
      const req = { user: { id: 'user-1' } };
      await controller.findAll(query, req);
      expect(service.findAll).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          title: { contains: 'Test', mode: 'insensitive' },
          style: 'CARTOON',
        },
        skip: 0,
        take: 10,
      });
    });

    it('should treat search as a title filter alias', async () => {
      const query = { search: 'Moon', page: '1', limit: '10' };
      const req = { user: { id: 'user-3' } };
      await controller.findAll(query as any, req);
      expect(service.findAll).toHaveBeenCalledWith({
        where: {
          userId: 'user-3',
          title: { contains: 'Moon', mode: 'insensitive' },
        },
        skip: 0,
        take: 10,
      });
    });

    it('should include status and childId filters when provided', async () => {
      const query = { status: 'REVIEW', childId: 'child-1', page: '2', limit: '5' };
      const req = { user: { id: 'user-2' } };
      await controller.findAll(query, req);
      expect(service.findAll).toHaveBeenCalledWith({
        where: {
          userId: 'user-2',
          status: 'REVIEW',
          childId: 'child-1',
        },
        skip: 5,
        take: 5,
      });
    });
  });

  describe('generate', () => {
    it('should call createAndGenerate with dto and userId', async () => {
      const dto: any = { childId: 'c1', type: 'AI_ADAPTED', style: 'WATERCOLOR' };
      const req = { user: { id: 'user-1' } };
      await controller.generate(dto, req);
      expect(service.createAndGenerate).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('findOne', () => {
    it('should call getById with book id and userId', async () => {
      const req = { user: { id: 'user-1' } };
      await controller.findOne('book-1', req);
      expect(service.getById).toHaveBeenCalledWith('book-1', 'user-1');
    });
  });

  describe('preview', () => {
    it('should call getPreview with book id and userId', async () => {
      const req = { user: { id: 'user-1' } };
      await controller.preview('book-1', req);
      expect(service.getPreview).toHaveBeenCalledWith('book-1', 'user-1');
    });
  });

  describe('approve', () => {
    it('should call approveBook with book id and userId', async () => {
      const req = { user: { id: 'user-1' } };
      await controller.approve('book-1', req);
      expect(service.approveBook).toHaveBeenCalledWith('book-1', 'user-1');
    });
  });

  describe('editPage', () => {
    it('should call editPage with book id, page number, body and userId', async () => {
      const req = { user: { id: 'user-1' } };
      const body = { textContent: 'Updated text' };
      await controller.editPage('book-1', 3, body as any, req);
      expect(service.editPage).toHaveBeenCalledWith('book-1', 3, body, 'user-1');
    });
  });

  describe('regenerate', () => {
    it('should call regenerate with book id, body and userId', async () => {
      const req = { user: { id: 'user-1' } };
      const body = { parentFeedback: 'Make it shorter' };
      await controller.regenerate('book-1', body as any, req);
      expect(service.regenerate).toHaveBeenCalledWith('book-1', body, 'user-1');
    });
  });

  describe('getPdf', () => {
    it('should call getPdfUrl with book id and userId', async () => {
      const req = { user: { id: 'user-1' } };
      await controller.getPdf('book-1', req);
      expect(service.getPdfUrl).toHaveBeenCalledWith('book-1', 'user-1');
    });
  });
});

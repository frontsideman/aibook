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
  });

  describe('generate', () => {
    it('should call createAndGenerate with dto and userId', async () => {
      const dto: any = { childId: 'c1', type: 'AI_ADAPTED', style: 'WATERCOLOR' };
      const req = { user: { id: 'user-1' } };
      await controller.generate(dto, req);
      expect(service.createAndGenerate).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('preview', () => {
    it('should call getPreview with book id', async () => {
      await controller.preview('book-1');
      expect(service.getPreview).toHaveBeenCalledWith('book-1');
    });
  });

  describe('approve', () => {
    it('should call approveBook with book id', async () => {
      await controller.approve('book-1');
      expect(service.approveBook).toHaveBeenCalledWith('book-1');
    });
  });
});

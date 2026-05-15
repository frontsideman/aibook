import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from './book.controller';
import { BookService } from './book.service';

describe('BookController', () => {
  let controller: BookController;
  let service: BookService;

  const mockBookService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [
        {
          provide: BookService,
          useValue: mockBookService,
        },
      ],
    }).compile();

    controller = module.get<BookController>(BookController);
    service = module.get<BookService>(BookService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call bookService.findAll with correct parameters', async () => {
      const query = { title: 'Test', style: 'Cartoon', page: 1, limit: 10 };
      await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith({
        where: {
          title: { contains: 'Test', mode: 'insensitive' },
          style: { contains: 'Cartoon', mode: 'insensitive' },
        },
        skip: 0,
        take: 10,
      });
    });

    it('should use default pagination values', async () => {
      const query = {};
      await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
      });
    });
    
    it('should calculate skip correctly for page 2', async () => {
      const query = { page: 2 };
      await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith({
        where: {},
        skip: 10,
        take: 10,
      });
    });
  });
});

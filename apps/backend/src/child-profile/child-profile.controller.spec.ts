import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChildProfileController } from './child-profile.controller';
import { ChildProfileService } from './child-profile.service';
import { PrismaService } from '../prisma.service';

describe('ChildProfileController', () => {
  let controller: ChildProfileController;

  const mockChildProfileService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChildProfileController],
      providers: [
        { provide: ChildProfileService, useValue: mockChildProfileService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: PrismaService,
          useValue: {
            client: {
              user: { upsert: jest.fn() },
              childProfile: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    controller = module.get(ChildProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

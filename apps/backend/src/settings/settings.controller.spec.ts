import { Test, type TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { MockAuthGuard } from '../mock-auth.guard';
import { ReasoningEffort } from '@repo/database';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

  const mockSettingsService = {
    getGenerationSettings: jest.fn(),
    updateGenerationSettings: jest.fn(),
  };

  const mockPrismaService = {
    client: {
      user: { findUnique: jest.fn(), upsert: jest.fn() },
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('true'),
  };

  const mockMockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MockAuthGuard, useValue: mockMockAuthGuard },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns owner-scoped generation settings', async () => {
    mockSettingsService.getGenerationSettings.mockResolvedValue({
      llmModel: 'openai:gpt-5.4-mini',
      reasoningEffort: ReasoningEffort.MEDIUM,
    });

    await controller.getGenerationSettings({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    });

    expect(service.getGenerationSettings).toHaveBeenCalledWith('user-1');
  });

  it('updates owner-scoped generation settings', async () => {
    const body = {
      llmModel: 'openai:gpt-5.4',
      reasoningEffort: ReasoningEffort.HIGH,
    };

    await controller.updateGenerationSettings(body, {
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    });

    expect(service.updateGenerationSettings).toHaveBeenCalledWith('user-1', body);
  });
});

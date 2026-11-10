import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { ReasoningEffort } from '@repo/database';
import { PrismaService } from '../prisma.service';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPrismaService = { client: mockPrismaClient };
  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('openai:env-model'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.getOrThrow.mockReturnValue('openai:env-model');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('returns the active env model and persisted reasoning effort', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      preferredReasoningEffort: ReasoningEffort.HIGH,
    });

    await expect(service.getGenerationSettings('user-1')).resolves.toEqual({
      llmModel: 'openai:env-model',
      reasoningEffort: ReasoningEffort.HIGH,
    });

    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('LLM_MODEL_NAME');
  });

  it('ignores a stale stored model preference because model selection is inactive', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      preferredReasoningEffort: ReasoningEffort.MEDIUM,
      preferredLlmModel: 'openai:gpt-5.4-mini',
    });

    await expect(service.getGenerationSettings('user-1')).resolves.toEqual({
      llmModel: 'openai:env-model',
      reasoningEffort: ReasoningEffort.MEDIUM,
    });
  });

  it('raises a controlled not found error when the user does not exist', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue(null);

    await expect(service.getGenerationSettings('missing-user')).rejects.toThrow(NotFoundException);
  });

  it('rejects an invalid reasoning effort', async () => {
    await expect(
      service.updateGenerationSettings('user-1', {
        reasoningEffort: 'EXTREME' as ReasoningEffort,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('persists only reasoning effort and returns the active env model', async () => {
    mockPrismaClient.user.update.mockResolvedValue({
      preferredReasoningEffort: ReasoningEffort.MEDIUM,
    });

    await expect(
      service.updateGenerationSettings('user-1', {
        reasoningEffort: ReasoningEffort.MEDIUM,
      })
    ).resolves.toEqual({
      llmModel: 'openai:env-model',
      reasoningEffort: ReasoningEffort.MEDIUM,
    });

    expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { preferredReasoningEffort: ReasoningEffort.MEDIUM },
      select: { preferredReasoningEffort: true },
    });
  });

  it('raises a controlled not found error when update hits a missing user', async () => {
    mockPrismaClient.user.update.mockRejectedValue({ code: 'P2025' });

    await expect(
      service.updateGenerationSettings('missing-user', {
        reasoningEffort: ReasoningEffort.MEDIUM,
      })
    ).rejects.toThrow(NotFoundException);
  });
});

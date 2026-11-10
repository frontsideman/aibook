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
    getOrThrow: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.getOrThrow.mockReturnValue('env-model');
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'LLM_MODELS' ? 'env-model,pro-model' : undefined
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('returns the configured allowlist and persisted reasoning effort', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      preferredReasoningEffort: ReasoningEffort.HIGH,
      preferredLlmModel: null,
    });

    await expect(service.getGenerationSettings('user-1')).resolves.toEqual({
      llmModel: 'env-model',
      reasoningEffort: ReasoningEffort.HIGH,
      availableModels: ['env-model', 'pro-model'],
    });
  });

  it('returns the user preferred model when it is in the allowlist', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      preferredReasoningEffort: ReasoningEffort.MEDIUM,
      preferredLlmModel: 'pro-model',
    });

    await expect(service.getGenerationSettings('user-1')).resolves.toEqual({
      llmModel: 'pro-model',
      reasoningEffort: ReasoningEffort.MEDIUM,
      availableModels: ['env-model', 'pro-model'],
    });
  });

  it('falls back to the env model when the stored preference is stale', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      preferredReasoningEffort: ReasoningEffort.MEDIUM,
      preferredLlmModel: 'openai:gpt-5.4-mini',
    });

    await expect(service.getGenerationSettings('user-1')).resolves.toEqual({
      llmModel: 'env-model',
      reasoningEffort: ReasoningEffort.MEDIUM,
      availableModels: ['env-model', 'pro-model'],
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

  it('rejects a model outside the allowlist', async () => {
    await expect(
      service.updateGenerationSettings('user-1', {
        llmModel: 'unknown-model',
        reasoningEffort: ReasoningEffort.MEDIUM,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('persists model and reasoning effort and returns the resolved settings', async () => {
    mockPrismaClient.user.update.mockResolvedValue({
      preferredLlmModel: 'pro-model',
      preferredReasoningEffort: ReasoningEffort.HIGH,
    });

    await expect(
      service.updateGenerationSettings('user-1', {
        llmModel: 'pro-model',
        reasoningEffort: ReasoningEffort.HIGH,
      })
    ).resolves.toEqual({
      llmModel: 'pro-model',
      reasoningEffort: ReasoningEffort.HIGH,
      availableModels: ['env-model', 'pro-model'],
    });

    expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        preferredReasoningEffort: ReasoningEffort.HIGH,
        preferredLlmModel: 'pro-model',
      },
      select: { preferredLlmModel: true, preferredReasoningEffort: true },
    });
  });

  it('keeps the existing model when only reasoning effort is sent', async () => {
    mockPrismaClient.user.update.mockResolvedValue({
      preferredLlmModel: 'pro-model',
      preferredReasoningEffort: ReasoningEffort.MEDIUM,
    });

    await service.updateGenerationSettings('user-1', {
      reasoningEffort: ReasoningEffort.MEDIUM,
    });

    expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { preferredReasoningEffort: ReasoningEffort.MEDIUM },
      select: { preferredLlmModel: true, preferredReasoningEffort: true },
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

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('rejects an invalid reasoning effort', async () => {
    await expect(
      service.updateGenerationSettings('user-1', {
        llmModel: 'openai:gpt-5.4-mini',
        reasoningEffort: 'EXTREME' as ReasoningEffort,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a malformed llmModel', async () => {
    await expect(
      service.updateGenerationSettings('user-1', {
        llmModel: 'bad model',
        reasoningEffort: ReasoningEffort.MEDIUM,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('raises a controlled not found error when the user does not exist', async () => {
    mockPrismaClient.user.update.mockRejectedValue({ code: 'P2025' });

    await expect(
      service.updateGenerationSettings('missing-user', {
        llmModel: 'openai:gpt-5.4-mini',
        reasoningEffort: ReasoningEffort.MEDIUM,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { AI_PROVIDER_TOKEN, AiProvider } from './ai.provider.interface';
import { ReasoningEffort } from '@repo/database';

describe('AiService', () => {
  let service: AiService;
  let mockProvider: AiProvider;

  beforeEach(async () => {
    mockProvider = {
      generateStory: jest.fn().mockResolvedValue('Once upon a time...'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: AI_PROVIDER_TOKEN,
          useValue: mockProvider,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call generateStory on the provider', async () => {
    const prompt = 'a brave little cat';
    const options = {
      model: 'openai:gpt-5.4-mini',
      reasoningEffort: ReasoningEffort.MEDIUM,
    };
    const result = await service.generateStory(prompt, options);
    expect(result).toBe('Once upon a time...');
    expect(mockProvider.generateStory).toHaveBeenCalledWith(prompt, options);
  });
});

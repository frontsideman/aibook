import { Test, TestingModule } from '@nestjs/testing';
import { MockAiService } from './mock-ai.service';
import { ReasoningEffort } from '@repo/database';

describe('MockAiService', () => {
  let service: MockAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockAiService],
    }).compile();

    service = module.get<MockAiService>(MockAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a placeholder story', async () => {
    const prompt = 'any prompt';
    const result = await service.generateStory(prompt, {
      model: 'openai:gpt-5.4-mini',
      reasoningEffort: ReasoningEffort.MEDIUM,
    });
    expect(result).toContain('Once upon a time');
    expect(result).toContain(prompt);
  });

  it('should return a placeholder image URL', async () => {
    const prompt = 'any prompt';
    const result = await service.generateImage(prompt);
    expect(result).toBe('https://via.placeholder.com/512?text=any%20prompt');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { AI_PROVIDER_TOKEN, AiProvider } from './ai.provider.interface';

describe('AiService', () => {
  let service: AiService;
  let mockProvider: AiProvider;

  beforeEach(async () => {
    mockProvider = {
      generateStory: jest.fn().mockResolvedValue('Once upon a time...'),
      generateImage: jest.fn().mockResolvedValue('https://placeholder.com/image.png'),
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
    const result = await service.generateStory(prompt);
    expect(result).toBe('Once upon a time...');
    expect(mockProvider.generateStory).toHaveBeenCalledWith(prompt);
  });

  it('should call generateImage on the provider', async () => {
    const prompt = 'a brave little cat';
    const result = await service.generateImage(prompt);
    expect(result).toBe('https://placeholder.com/image.png');
    expect(mockProvider.generateImage).toHaveBeenCalledWith(prompt);
  });
});

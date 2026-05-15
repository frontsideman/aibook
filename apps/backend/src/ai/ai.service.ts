import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER_TOKEN, AiProvider } from './ai.provider.interface';

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: AiProvider,
  ) {}

  async generateStory(prompt: string): Promise<string> {
    return this.aiProvider.generateStory(prompt);
  }

  async generateImage(prompt: string): Promise<string> {
    return this.aiProvider.generateImage(prompt);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  AI_PROVIDER_TOKEN,
  AiProvider,
  StoryGenerationOptions,
} from './ai.provider.interface';

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: AiProvider,
  ) {}

  async generateStory(prompt: string, options: StoryGenerationOptions): Promise<string> {

    console.log("🚀 +++ AiService +++ generateStory +++ prompt:", prompt)

    return this.aiProvider.generateStory(prompt, options);
  }
}

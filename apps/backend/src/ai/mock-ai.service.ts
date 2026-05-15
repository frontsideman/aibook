import { Injectable } from '@nestjs/common';
import { AiProvider } from './ai.provider.interface';

@Injectable()
export class MockAiService implements AiProvider {
  async generateStory(prompt: string): Promise<string> {
    return `Once upon a time, there was a story about: ${prompt}. It was a magical adventure that everyone loved.`;
  }

  async generateImage(prompt: string): Promise<string> {
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://via.placeholder.com/512?text=${encodedPrompt}`;
  }
}

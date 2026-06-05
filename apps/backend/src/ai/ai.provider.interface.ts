import { ReasoningEffort } from '@repo/database';

export interface StoryGenerationOptions {
  model: string;
  reasoningEffort: ReasoningEffort;
}

export interface AiProvider {
  generateStory(prompt: string, options: StoryGenerationOptions): Promise<string>;
  generateImage(prompt: string): Promise<string>;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';

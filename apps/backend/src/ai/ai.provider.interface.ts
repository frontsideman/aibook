import { ReasoningEffort } from '@repo/database';

export interface StoryGenerationOptions {
  /**
   * The requested model is part of the service contract, but the current LLM
   * gateway intentionally resolves the effective model from environment
   * configuration.
   */
  model: string;
  reasoningEffort: ReasoningEffort;
}

export interface AiProvider {
  generateStory(prompt: string, options: StoryGenerationOptions): Promise<string>;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';

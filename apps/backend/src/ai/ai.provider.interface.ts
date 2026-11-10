import type { ReasoningEffort } from '@repo/database';

export interface StoryGenerationOptions {
  /** Model snapshot stored on the book, selected from the configured allowlist. */
  model: string;
  reasoningEffort: ReasoningEffort;
}

export interface AiProvider {
  generateStory(prompt: string, options: StoryGenerationOptions): Promise<string>;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';

export interface AiProvider {
  generateStory(prompt: string): Promise<string>;
  generateImage(prompt: string): Promise<string>;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';

import type { ConfigService } from '@nestjs/config';

export interface LlmConfig {
  apiUrl: string;
  apiKey: string;
  modelName: string;
}

export function getLlmConfig(configService: ConfigService): LlmConfig {
  const apiUrl = configService.get<string>('LLM_API_URL');
  const apiKey = configService.get<string>('LLM_API_KEY');
  const modelName = configService.get<string>('LLM_MODEL_NAME');

  if (!apiUrl || !apiKey || !modelName) {
    throw new Error('LLM configuration is incomplete');
  }

  return { apiUrl, apiKey, modelName };
}

/**
 * The active env model is always available. Additional models can be exposed to
 * the settings UI through a comma-separated LLM_MODELS value.
 */
export function getAvailableLlmModels(configService: ConfigService): string[] {
  const activeModel = configService.getOrThrow<string>('LLM_MODEL_NAME').trim();
  const configured = configService.get<string>('LLM_MODELS') ?? '';

  const models = configured
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  return [...new Set([activeModel, ...models])];
}

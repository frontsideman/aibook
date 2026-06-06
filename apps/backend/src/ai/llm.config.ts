import { ConfigService } from '@nestjs/config';

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

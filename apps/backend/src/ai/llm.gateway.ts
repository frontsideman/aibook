import { ConfigService } from '@nestjs/config';
import { StoryGenerationOptions } from './ai.provider.interface';
import { getLlmConfig } from './llm.config';

type ProviderResponse = {
  storyText?: string;
};

const LLM_REQUEST_TIMEOUT_MS = 30_000;

function toGatewayError(message: string): Error {
  return new Error(`LLM provider response invalid: ${message}`);
}

function toTimeoutError(): Error {
  return new Error('LLM provider request timed out');
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' ||
      error.name === 'TimeoutError' ||
      error.message.toLowerCase().includes('aborted') ||
      error.message.toLowerCase().includes('timeout'))
  );
}

export class LlmGateway {
  constructor(
    private readonly configService: ConfigService,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async generateStory(
    prompt: string,
    _options: StoryGenerationOptions,
  ): Promise<string> {
    const { apiUrl, apiKey, modelName } = getLlmConfig(this.configService);
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), LLM_REQUEST_TIMEOUT_MS);

    try {
      const response = await this.fetchImpl(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: modelName,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`LLM provider request failed with status ${response.status}`);
      }

      let body: ProviderResponse;
      try {
        body = (await response.json()) as ProviderResponse;
      } catch {
        throw toGatewayError('failed to parse JSON response');
      }

      if (typeof body !== 'object' || body === null) {
        throw toGatewayError('response body was not an object');
      }

      if (typeof body.storyText !== 'string') {
        throw toGatewayError('response did not include story text');
      }

      if (body.storyText.trim().length === 0) {
        throw toGatewayError('story text was empty');
      }

      return body.storyText;
    } catch (error) {
      if (isAbortError(error)) {
        throw toTimeoutError();
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

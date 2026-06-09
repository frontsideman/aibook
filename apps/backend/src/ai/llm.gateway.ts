import type { StoryGenerationOptions } from './ai.provider.interface';
import type { LlmConfig } from './llm.config';

type ProviderResponse = {
  storyText?: string;
  choices?: Array<{ message?: { content?: string } }>;
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

function buildRequestUrl(apiUrl: string) {
  const normalized = apiUrl.replace(/\/$/, '');
  if (normalized.endsWith('/chat/completions')) {
    return normalized;
  }

  return `${normalized}/chat/completions`;
}

export class LlmGateway {
  constructor(
    private readonly config: LlmConfig,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async generateStory(prompt: string, options: StoryGenerationOptions): Promise<string> {
    const { apiUrl, apiKey, modelName } = this.config;
    const requestUrl = buildRequestUrl(apiUrl);
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), LLM_REQUEST_TIMEOUT_MS);

    try {
      const response = await this.fetchImpl(requestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          reasoning_effort: options.reasoningEffort.toLowerCase(),
          stream: false,
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

      const choiceContent = body.choices?.[0]?.message?.content;
      if (typeof choiceContent === 'string') {
        const trimmed = choiceContent.trim();
        if (trimmed.length === 0) {
          throw toGatewayError('story text was empty');
        }
        return trimmed;
      }

      if (Object.prototype.hasOwnProperty.call(body, 'storyText')) {
        if (typeof body.storyText !== 'string') {
          throw toGatewayError('response did not include story text');
        }

        const trimmed = body.storyText.trim();
        if (trimmed.length === 0) {
          throw toGatewayError('story text was empty');
        }

        return trimmed;
      }

      throw toGatewayError('response did not include story text');
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

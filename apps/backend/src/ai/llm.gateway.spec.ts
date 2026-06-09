import { ReasoningEffort } from '@repo/database';
import { LlmGateway } from './llm.gateway';
import type { LlmConfig } from './llm.config';

describe('LlmGateway', () => {
  const config: LlmConfig = {
    apiUrl: 'https://provider.example.com/chat/completions',
    apiKey: 'secret-key',
    modelName: 'storybook-model',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('posts the prompt and configured model to the provider endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ storyText: 'Once upon a time...' }),
    });
    const gateway = new LlmGateway(config, fetchMock as typeof fetch);
    const options = {
      model: 'openai:gpt-5.4-mini',
      reasoningEffort: ReasoningEffort.MEDIUM,
    };

    await gateway.generateStory('A brave little cat', options);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://provider.example.com/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-key',
          'Content-Type': 'application/json',
        }),
        signal: expect.any(AbortSignal),
        body: JSON.stringify({
          model: 'storybook-model',
          messages: [{ role: 'user', content: 'A brave little cat' }],
          reasoning_effort: 'medium',
          stream: false,
        }),
      })
    );
  });

  it('aborts the provider request with a normalized timeout error', async () => {
    jest.useFakeTimers();
    try {
      const fetchMock = jest.fn().mockImplementation((_url, init) => {
        const signal = init?.signal as AbortSignal | undefined;

        expect(signal).toBeInstanceOf(AbortSignal);

        return new Promise((_, reject) => {
          signal?.addEventListener(
            'abort',
            () => {
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            },
            { once: true }
          );
        });
      });
      const gateway = new LlmGateway(config, fetchMock as typeof fetch);

      const requestPromise = gateway.generateStory('A brave little cat', {
        model: 'storybook-model',
        reasoningEffort: ReasoningEffort.MEDIUM,
      });
      const rejectionAssertion = expect(requestPromise).rejects.toThrow(
        'LLM provider request timed out'
      );

      await jest.advanceTimersByTimeAsync(30_000);

      await rejectionAssertion;

      expect(fetchMock).toHaveBeenCalledWith(
        'https://provider.example.com/chat/completions',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('ignores the requested model and still uses the configured env model', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ storyText: 'Once upon a time...' }),
    });
    const gateway = new LlmGateway(config, fetchMock as typeof fetch);

    await gateway.generateStory('A brave little cat', {
      model: 'different-requested-model',
      reasoningEffort: ReasoningEffort.MEDIUM,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://provider.example.com/chat/completions',
      expect.objectContaining({
        body: JSON.stringify({
          model: 'storybook-model',
          messages: [{ role: 'user', content: 'A brave little cat' }],
          reasoning_effort: 'medium',
          stream: false,
        }),
      })
    );
  });

  it('returns story text from a valid provider response', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ storyText: 'Once upon a time...' }),
    });
    const gateway = new LlmGateway(config, fetchMock as typeof fetch);

    await expect(
      gateway.generateStory('A brave little cat', {
        model: 'storybook-model',
        reasoningEffort: ReasoningEffort.MEDIUM,
      })
    ).resolves.toBe('Once upon a time...');
  });

  it('throws on non-2xx response', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: jest.fn(),
    });
    const gateway = new LlmGateway(config, fetchMock as typeof fetch);

    await expect(
      gateway.generateStory('A brave little cat', {
        model: 'storybook-model',
        reasoningEffort: ReasoningEffort.MEDIUM,
      })
    ).rejects.toThrow('LLM provider request failed with status 500');
  });

  it('throws when response lacks story text', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });
    const gateway = new LlmGateway(config, fetchMock as typeof fetch);

    await expect(
      gateway.generateStory('A brave little cat', {
        model: 'storybook-model',
        reasoningEffort: ReasoningEffort.MEDIUM,
      })
    ).rejects.toThrow('LLM provider response invalid: response did not include story text');
  });

  it('rejects whitespace-only story text', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ storyText: '   \n\t  ' }),
    });
    const gateway = new LlmGateway(config, fetchMock as typeof fetch);

    await expect(
      gateway.generateStory('A brave little cat', {
        model: 'storybook-model',
        reasoningEffort: ReasoningEffort.MEDIUM,
      })
    ).rejects.toThrow('LLM provider response invalid: story text was empty');
  });

  it('rejects non-string story text', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ storyText: 123 }),
    });
    const gateway = new LlmGateway(config, fetchMock as typeof fetch);

    await expect(
      gateway.generateStory('A brave little cat', {
        model: 'storybook-model',
        reasoningEffort: ReasoningEffort.MEDIUM,
      })
    ).rejects.toThrow('LLM provider response invalid: response did not include story text');
  });

  it('rejects invalid JSON with a normalized error', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('Unexpected token < in JSON')),
    });
    const gateway = new LlmGateway(config, fetchMock as typeof fetch);

    await expect(
      gateway.generateStory('A brave little cat', {
        model: 'storybook-model',
        reasoningEffort: ReasoningEffort.MEDIUM,
      })
    ).rejects.toThrow('LLM provider response invalid: failed to parse JSON response');
  });
});

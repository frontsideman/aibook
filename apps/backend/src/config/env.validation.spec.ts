import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('passes with minimal valid config', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        LLM_API_URL: 'https://api.example.com',
        LLM_API_KEY: 'secret',
        LLM_MODEL_NAME: 'model',
        LLM_DEFAULT_PROMPT: 'Write a story',
      })
    ).not.toThrow();
  });

  it('fails when DATABASE_URL is missing', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL is required/);
  });

  it('fails when REDIS_PORT is not numeric', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        REDIS_PORT: 'abc',
      })
    ).toThrow(/REDIS_PORT must be a valid integer/);
  });

  it('fails when MOCK_AUTH is invalid', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        MOCK_AUTH: 'yes',
      })
    ).toThrow(/MOCK_AUTH must be either "true" or "false"/);
  });

  it('fails when LLM_API_URL is missing', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        LLM_API_KEY: 'secret',
        LLM_MODEL_NAME: 'model',
      })
    ).toThrow(/LLM_API_URL is required/);
  });

  it('fails when LLM_API_URL is not an absolute http/https URL', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        LLM_API_URL: 'api.example.com',
        LLM_API_KEY: 'secret',
        LLM_MODEL_NAME: 'model',
      })
    ).toThrow(/LLM_API_URL must be a valid absolute http\/https URL/);
  });

  it('fails when LLM_API_KEY is missing', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        LLM_API_URL: 'https://api.example.com',
        LLM_MODEL_NAME: 'model',
      })
    ).toThrow(/LLM_API_KEY is required/);
  });

  it('fails when LLM_MODEL_NAME is missing', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        LLM_API_URL: 'https://api.example.com',
        LLM_API_KEY: 'secret',
      })
    ).toThrow(/LLM_MODEL_NAME is required/);
  });
});

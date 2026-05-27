import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('passes with minimal valid config', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      }),
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
      }),
    ).toThrow(/REDIS_PORT must be a valid integer/);
  });

  it('fails when MOCK_AUTH is invalid', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        MOCK_AUTH: 'yes',
      }),
    ).toThrow(/MOCK_AUTH must be either "true" or "false"/);
  });
});

type EnvInput = Record<string, unknown>;

function getString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function validateEnv(config: EnvInput): EnvInput {
  const errors: string[] = [];

  const databaseUrl = getString(config.DATABASE_URL);
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  const redisPort = getString(config.REDIS_PORT);
  if (redisPort && Number.isNaN(Number.parseInt(redisPort, 10))) {
    errors.push('REDIS_PORT must be a valid integer');
  }

  const mockAuth = getString(config.MOCK_AUTH);
  if (mockAuth && mockAuth !== 'true' && mockAuth !== 'false') {
    errors.push('MOCK_AUTH must be either "true" or "false"');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.join('; ')}`);
  }

  return config;
}

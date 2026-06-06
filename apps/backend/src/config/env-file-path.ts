import { resolve } from 'node:path';

export function resolveBackendEnvFilePath(currentDir: string = __dirname) {
  return resolve(currentDir, '..', '..', '.env');
}

export const BACKEND_ENV_FILE_PATH = resolveBackendEnvFilePath();

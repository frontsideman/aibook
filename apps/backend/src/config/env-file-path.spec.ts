import { resolveBackendEnvFilePath } from './env-file-path';

describe('resolveBackendEnvFilePath', () => {
  it('resolves apps/backend/.env from the source config directory', () => {
    expect(
      resolveBackendEnvFilePath('/workspace/aiBook/apps/backend/src/config'),
    ).toBe('/workspace/aiBook/apps/backend/.env');
  });

  it('resolves apps/backend/.env from the built config directory', () => {
    expect(
      resolveBackendEnvFilePath('/workspace/aiBook/apps/backend/dist/config'),
    ).toBe('/workspace/aiBook/apps/backend/.env');
  });
});

export const MOCK_AUTH_STORAGE_KEY = 'aibook.mock-auth-session';

export type MockAuthUser = {
  id: string;
  email: string;
  name: string;
};

export function createDemoSession(
  input: Pick<MockAuthUser, 'email' | 'name'>,
): MockAuthUser {
  return {
    id: 'demo-user',
    email: input.email,
    name: input.name,
  };
}

export function readMockSession(): MockAuthUser | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  let storedSession: string | null;

  try {
    storedSession = storage.getItem(MOCK_AUTH_STORAGE_KEY);
  } catch {
    return null;
  }

  if (!storedSession) {
    return null;
  }

  try {
    const parsedSession: unknown = JSON.parse(storedSession);

    if (!isMockAuthUser(parsedSession)) {
      removeStoredSession(storage);
      return null;
    }

    return parsedSession;
  } catch {
    removeStoredSession(storage);
    return null;
  }
}

function isMockAuthUser(value: unknown): value is MockAuthUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<Record<keyof MockAuthUser, unknown>>;

  return (
    typeof session.id === 'string' &&
    typeof session.email === 'string' &&
    typeof session.name === 'string'
  );
}

export function writeMockSession(session: MockAuthUser): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    return;
  }
}

export function clearMockSession(): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  removeStoredSession(storage);
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function removeStoredSession(storage: Storage): void {
  try {
    storage.removeItem(MOCK_AUTH_STORAGE_KEY);
  } catch {
    return;
  }
}

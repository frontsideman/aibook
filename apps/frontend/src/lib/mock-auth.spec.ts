import { beforeEach, describe, expect, it } from 'vitest';

import {
  MOCK_AUTH_STORAGE_KEY,
  clearMockSession,
  createDemoSession,
  readMockSession,
  writeMockSession,
} from './mock-auth';

function ensureClearableLocalStorage(): void {
  if (typeof window.localStorage.clear === 'function') {
    return;
  }

  const storage = new Map<string, string>();

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => {
        storage.delete(key);
      },
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    },
  });
}

function withLocalStorageOverride(
  value: Storage | undefined,
  run: () => void,
): void {
  const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value,
  });

  try {
    run();
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(window, 'localStorage', originalDescriptor);
    }
  }
}

describe('mock auth storage', () => {
  beforeEach(() => {
    ensureClearableLocalStorage();
    window.localStorage.clear();
  });

  it('returns null when no session is stored', () => {
    expect(readMockSession()).toBeNull();
  });

  it('persists and restores a demo session', () => {
    const session = createDemoSession({
      email: 'demo@example.com',
      name: 'Demo User',
    });

    writeMockSession(session);

    expect(readMockSession()).toEqual({
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
    });
  });

  it('clears the stored session', () => {
    const session = createDemoSession({
      email: 'demo@example.com',
      name: 'Demo User',
    });

    writeMockSession(session);
    clearMockSession();

    expect(readMockSession()).toBeNull();
  });

  it('removes malformed json from storage', () => {
    window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, '{');

    expect(readMockSession()).toBeNull();
    expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toBeNull();
  });

  it('removes structurally invalid stored sessions', () => {
    window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify({ id: 1 }));

    expect(readMockSession()).toBeNull();
    expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toBeNull();
  });

  it('does not throw when writing or clearing without window', () => {
    const originalWindow = globalThis.window;

    try {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: undefined,
      });

      expect(() =>
        writeMockSession(
          createDemoSession({
            email: 'demo@example.com',
            name: 'Demo User',
          }),
        ),
      ).not.toThrow();
      expect(() => clearMockSession()).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }
  });

  it('returns null when localStorage access throws', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('storage unavailable');
      },
    });

    try {
      expect(readMockSession()).toBeNull();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor);
      }
    }
  });

  it('treats storage write and clear failures as no-op', () => {
    const session = createDemoSession({
      email: 'demo@example.com',
      name: 'Demo User',
    });

    withLocalStorageOverride(
      {
        clear: () => undefined,
        getItem: () => null,
        key: () => null,
        get length() {
          return 0;
        },
        removeItem: () => {
          throw new Error('remove failed');
        },
        setItem: () => {
          throw new Error('set failed');
        },
      } as Storage,
      () => {
        expect(() => writeMockSession(session)).not.toThrow();
        expect(() => clearMockSession()).not.toThrow();
      },
    );
  });

  it('returns null when storage methods throw', () => {
    withLocalStorageOverride(
      {
        clear: () => undefined,
        getItem: () => {
          throw new Error('get failed');
        },
        key: () => null,
        get length() {
          return 0;
        },
        removeItem: () => {
          throw new Error('remove failed');
        },
        setItem: () => undefined,
      } as Storage,
      () => {
        expect(readMockSession()).toBeNull();
      },
    );
  });
});

// oxlint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/vitest';

// Node 26 exposes `window.localStorage` without a usable storage implementation
// unless a backing file is configured. Keep tests deterministic across Node versions.
if (!window.localStorage) {
  const storage = new Map<string, string>();

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      key: (index: number) => [...storage.keys()][index] ?? null,
      get length() {
        return storage.size;
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      setItem: (key: string, value: string) => {
        storage.set(key, String(value));
      },
    },
  });
}

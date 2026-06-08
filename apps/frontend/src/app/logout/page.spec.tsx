import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { MOCK_AUTH_STORAGE_KEY, createDemoSession } from '@/lib/mock-auth';

import LogoutPage from './page';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

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

describe('LogoutPage', () => {
  beforeEach(() => {
    ensureClearableLocalStorage();
    window.localStorage.clear();
    replace.mockReset();
  });

  it('clears the mock session and redirects to login', async () => {
    window.localStorage.setItem(
      MOCK_AUTH_STORAGE_KEY,
      JSON.stringify(
        createDemoSession({
          email: 'parent@example.com',
          name: 'Parent',
        })
      )
    );

    render(
      <AuthProvider>
        <LogoutPage />
      </AuthProvider>
    );

    expect(screen.getByText('Signing out...')).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toBeNull();
    });

    expect(replace).toHaveBeenCalledWith('/login');
  });
});

import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  AuthProvider,
  useAuth,
} from '@/components/auth/AuthProvider';
import {
  MOCK_AUTH_STORAGE_KEY,
  createDemoSession,
} from '@/lib/mock-auth';

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

function AuthStateProbe() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="hydrating">{String(auth.isHydrating)}</div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="user-email">{auth.user?.email ?? 'none'}</div>
      <div data-testid="user-name">{auth.user?.name ?? 'none'}</div>
      <button
        type="button"
        onClick={() => {
          void auth.loginDemo({ email: 'demo@example.com' });
        }}
      >
        Login demo
      </button>
      <button
        type="button"
        onClick={() => {
          void auth.logout();
        }}
      >
        Logout
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    ensureClearableLocalStorage();
    window.localStorage.clear();
  });

  it('restores an existing stored session during hydration', async () => {
    window.localStorage.setItem(
      MOCK_AUTH_STORAGE_KEY,
      JSON.stringify(
        createDemoSession({
          email: 'stored@example.com',
          name: 'Stored Parent',
        }),
      ),
    );

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('hydrating')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user-email')).toHaveTextContent('stored@example.com');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Stored Parent');
  });

  it('loginDemo stores and exposes the authenticated user', async () => {
    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('hydrating')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByRole('button', { name: 'Login demo' }).click();
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user-email')).toHaveTextContent('demo@example.com');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Demo Parent');
    expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toContain(
      '"email":"demo@example.com"',
    );
  });

  it('logout clears authenticated state and storage', async () => {
    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('hydrating')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByRole('button', { name: 'Login demo' }).click();
    });

    act(() => {
      screen.getByRole('button', { name: 'Logout' }).click();
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user-email')).toHaveTextContent('none');
    expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toBeNull();
  });
});

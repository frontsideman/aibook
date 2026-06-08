import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { MOCK_AUTH_STORAGE_KEY, createDemoSession } from '@/lib/mock-auth';

import { AuthGuard } from './AuthGuard';

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

describe('AuthGuard', () => {
  beforeEach(() => {
    ensureClearableLocalStorage();
    window.localStorage.clear();
    replace.mockReset();
  });

  it('redirects authenticated users away from guest pages to /', async () => {
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
        <AuthGuard mode='guest'>
          <div>guest page</div>
        </AuthGuard>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/');
    });

    expect(screen.queryByText('guest page')).not.toBeInTheDocument();
  });

  it('redirects guests away from authenticated pages to /login', async () => {
    render(
      <AuthProvider>
        <AuthGuard mode='authenticated'>
          <div>private page</div>
        </AuthGuard>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login');
    });

    expect(screen.queryByText('private page')).not.toBeInTheDocument();
  });

  it('renders authenticated pages when a session exists', async () => {
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
        <AuthGuard mode='authenticated'>
          <div>private page</div>
        </AuthGuard>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('private page')).toBeInTheDocument();
    });

    expect(replace).not.toHaveBeenCalled();
  });

  it('renders guest pages when no session exists and hydration resolves', async () => {
    render(
      <AuthProvider>
        <AuthGuard mode='guest'>
          <div>guest page</div>
        </AuthGuard>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('guest page')).toBeInTheDocument();
    });

    expect(replace).not.toHaveBeenCalled();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { MOCK_AUTH_STORAGE_KEY } from '@/lib/mock-auth';
import LoginPage from './login/page';
import SignupPage from './signup/page';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

function ensureClearableLocalStorage(): void {
  try {
    if (typeof window.localStorage?.clear === 'function') {
      return;
    }
  } catch {
    // Fall through and redefine storage with a stable test double.
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

function renderLoginPage() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>,
  );
}

function renderSignupPage() {
  return render(
    <AuthProvider>
      <SignupPage />
    </AuthProvider>,
  );
}

describe('auth pages', () => {
  beforeEach(() => {
    ensureClearableLocalStorage();
    window.localStorage.clear();
    replace.mockReset();
  });

  it('redefines localStorage when accessing it throws', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked storage');
      },
    });

    expect(() => ensureClearableLocalStorage()).not.toThrow();
    expect(typeof window.localStorage.clear).toBe('function');
  });

  it('renders login form with brand, heading, and secondary actions', () => {
    renderLoginPage();

    expect(screen.getByText('aiBook')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Sign in to continue your books.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Forgot password?' }),
    ).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      '/signup',
    );
  });

  it('shows inline validation when login fields are empty', async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('Check your email and password.'),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toBeNull();
  });

  it('shows loading state and completes demo login', async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'demo.parent@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret-passphrase' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('button', { name: 'Continuing...' })).toBeDisabled();

    await waitFor(() => {
      expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toContain(
        '"email":"demo.parent@example.com"',
      );
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/');
    });
  });

  it('shows signup helper copy and the login footer link', () => {
    renderSignupPage();

    expect(screen.getByText('aiBook')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Create your account' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Start creating personalized keepsakes.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(
      screen.getByText('Use at least 8 characters.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('shows inline validation when signup data is invalid', async () => {
    renderSignupPage();

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Ava Parent' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ava.parent@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText('Complete all fields with a valid password.'),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toBeNull();
  });

  it('shows loading state and completes demo signup', async () => {
    renderSignupPage();

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Ava Parent' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ava.parent@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret-passphrase' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      screen.getByRole('button', { name: 'Continuing...' }),
    ).toBeDisabled();

    await waitFor(() => {
      expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toContain(
        '"email":"ava.parent@example.com"',
      );
    });

    await waitFor(() => {
      expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toContain(
        '"name":"Ava Parent"',
      );
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/');
    });
  });
});

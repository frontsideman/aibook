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

function renderLoginPage() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>,
  );
}

describe('auth pages', () => {
  beforeEach(() => {
    ensureClearableLocalStorage();
    window.localStorage.clear();
    replace.mockReset();
  });

  it('renders login demo helper copy and secondary auth actions', () => {
    renderLoginPage();

    expect(screen.getByText(/demo parent/i)).toBeInTheDocument();
    expect(
      screen.getByText(/submit starts a local mock session/i),
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

  it('renders signup form fields and submit button', () => {
    render(<SignupPage />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });
});

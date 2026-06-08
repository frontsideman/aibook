import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/auth/AuthGuard', () => ({
  AuthGuard: ({
    children,
    mode,
  }: {
    children: React.ReactNode;
    mode: 'guest' | 'authenticated';
  }) => <div data-testid={`auth-guard-${mode}`}>{children}</div>,
}));

vi.mock('@/components/app-shell/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='app-shell-mock'>
      <nav>Dashboard</nav>
      <main>{children}</main>
    </div>
  ),
}));

describe('route group layouts', () => {
  it('app layout wraps children in authenticated guard and app shell', async () => {
    const { default: AppLayout } = await import('./(app)/layout');
    render(
      <AppLayout>
        <div>internal</div>
      </AppLayout>
    );

    const authGuard = screen.getByTestId('auth-guard-authenticated');
    const appShell = screen.getByTestId('app-shell-mock');

    expect(screen.getByText('internal')).toBeInTheDocument();
    expect(authGuard).toContainElement(appShell);
  });

  it('auth layout wraps children in guest guard', async () => {
    const { default: AuthLayout } = await import('./(auth)/layout');

    render(
      <AuthLayout>
        <div>auth</div>
      </AuthLayout>
    );

    const authGuard = screen.getByTestId('auth-guard-guest');
    const authContent = screen.getByText('auth');

    expect(authContent).toBeInTheDocument();
    expect(authGuard).toContainElement(authContent);
    expect(screen.queryByTestId('app-shell-mock')).not.toBeInTheDocument();
  });
});

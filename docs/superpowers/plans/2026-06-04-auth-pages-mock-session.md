# Auth Pages Mock Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Pencil-aligned login and signup pages with a frontend-only demo session, guarded auth/app route groups, and test coverage for routing and form behavior.

**Architecture:** Keep the existing App Router route groups and add a client-side mock auth layer backed by `localStorage`. Centralize session read/write logic in a small library, expose it through a React provider, and keep redirect decisions in guarded wrappers used by `(auth)` and `(app)` layouts. Update `LoginForm` and `SignupForm` to consume provider actions, render Pencil-derived states, and navigate into the app without backend calls.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Testing Library, shadcn/ui primitives

---

## File Structure

Create or modify these files:

- Create: `apps/frontend/src/lib/mock-auth.ts`
  - Owns the demo user type, storage key, client-safe read/write helpers, and demo session factory.
- Create: `apps/frontend/src/lib/mock-auth.spec.ts`
  - Verifies storage behavior, empty state, restore, create, and clear flows.
- Create: `apps/frontend/src/components/auth/AuthProvider.tsx`
  - Provides hydrated auth state and `loginDemo`, `signupDemo`, `logout` actions.
- Create: `apps/frontend/src/components/auth/AuthGuard.tsx`
  - Performs client-side guest/auth gating and redirects with `next/navigation`.
- Create: `apps/frontend/src/components/auth/AuthGuard.spec.tsx`
  - Tests guest/app redirects and the hydration hold state.
- Modify: `apps/frontend/src/app/layout.tsx`
  - Wraps the app in the auth provider.
- Modify: `apps/frontend/src/app/(auth)/layout.tsx`
  - Uses the guest guard around auth pages.
- Modify: `apps/frontend/src/app/(app)/layout.tsx`
  - Uses the authenticated guard around the shell.
- Modify: `apps/frontend/src/components/auth/LoginForm.tsx`
  - Rebuilds the login UI to match Pencil and connects it to the demo session actions.
- Modify: `apps/frontend/src/components/auth/SignupForm.tsx`
  - Rebuilds the signup UI to match Pencil and connects it to the demo session actions.
- Modify: `apps/frontend/src/app/(auth)/auth-pages.spec.tsx`
  - Covers visible auth UI, helper copy, validation, and loading states.
- Modify: `apps/frontend/src/app/layout-routing.spec.tsx`
  - Verifies layouts compose their guards and shell correctly.

## Task 1: Mock Auth Storage Module

**Files:**
- Create: `apps/frontend/src/lib/mock-auth.ts`
- Test: `apps/frontend/src/lib/mock-auth.spec.ts`

- [ ] **Step 1: Write the failing storage tests**

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import {
  MOCK_AUTH_STORAGE_KEY,
  clearMockSession,
  createDemoSession,
  readMockSession,
  writeMockSession,
} from './mock-auth';

describe('mock-auth storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns null when no session is stored', () => {
    expect(readMockSession()).toBeNull();
  });

  it('persists and restores a demo session', () => {
    const session = createDemoSession({
      email: 'demo@aibook.local',
      name: 'Demo Parent',
    });

    writeMockSession(session);

    expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toContain('demo@aibook.local');
    expect(readMockSession()).toEqual(session);
  });

  it('clears the stored session', () => {
    writeMockSession(
      createDemoSession({
        email: 'demo@aibook.local',
        name: 'Demo Parent',
      }),
    );

    clearMockSession();

    expect(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toBeNull();
    expect(readMockSession()).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --workspace apps/frontend run test -- src/lib/mock-auth.spec.ts`

Expected: FAIL with module-not-found for `./mock-auth`

- [ ] **Step 3: Write the minimal mock auth library**

```ts
export const MOCK_AUTH_STORAGE_KEY = 'aibook.mock-auth-session';

export type MockAuthUser = {
  id: string;
  email: string;
  name: string;
};

export function createDemoSession(input: Pick<MockAuthUser, 'email' | 'name'>): MockAuthUser {
  return {
    id: 'demo-user',
    email: input.email,
    name: input.name,
  };
}

export function readMockSession(): MockAuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as MockAuthUser;
  } catch {
    window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    return null;
  }
}

export function writeMockSession(session: MockAuthUser) {
  window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearMockSession() {
  window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --workspace apps/frontend run test -- src/lib/mock-auth.spec.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/lib/mock-auth.ts apps/frontend/src/lib/mock-auth.spec.ts
git commit -m "test(frontend): add mock auth storage module"
```

## Task 2: Auth Provider and Hook

**Files:**
- Create: `apps/frontend/src/components/auth/AuthProvider.tsx`
- Modify: `apps/frontend/src/app/layout.tsx`
- Test: `apps/frontend/src/components/auth/AuthGuard.spec.tsx`

- [ ] **Step 1: Write the failing provider-facing guard tests**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { AuthGuard } from './AuthGuard';
import { writeMockSession, clearMockSession, createDemoSession } from '@/lib/mock-auth';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    replace.mockReset();
    clearMockSession();
  });

  it('holds rendering until hydration completes', () => {
    render(
      <AuthProvider>
        <AuthGuard mode="guest">
          <div>auth page</div>
        </AuthGuard>
      </AuthProvider>,
    );

    expect(screen.queryByText('auth page')).not.toBeInTheDocument();
  });

  it('redirects authenticated users away from guest pages', async () => {
    writeMockSession(createDemoSession({ email: 'demo@aibook.local', name: 'Demo Parent' }));

    render(
      <AuthProvider>
        <AuthGuard mode="guest">
          <div>auth page</div>
        </AuthGuard>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/');
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --workspace apps/frontend run test -- src/components/auth/AuthGuard.spec.tsx`

Expected: FAIL with module-not-found for `AuthProvider` and `AuthGuard`

- [ ] **Step 3: Write the provider and wire it into the root layout**

```tsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  MockAuthUser,
  clearMockSession,
  createDemoSession,
  readMockSession,
  writeMockSession,
} from '@/lib/mock-auth';

type AuthContextValue = {
  user: MockAuthUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  loginDemo: (input: { email: string; name?: string }) => Promise<MockAuthUser>;
  signupDemo: (input: { email: string; name: string }) => Promise<MockAuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockAuthUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    setUser(readMockSession());
    setIsHydrating(false);
  }, []);

  async function loginDemo(input: { email: string; name?: string }) {
    const session = createDemoSession({
      email: input.email,
      name: input.name ?? 'Demo Parent',
    });
    writeMockSession(session);
    setUser(session);
    return session;
  }

  async function signupDemo(input: { email: string; name: string }) {
    const session = createDemoSession(input);
    writeMockSession(session);
    setUser(session);
    return session;
  }

  function logout() {
    clearMockSession();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isHydrating,
      loginDemo,
      signupDemo,
      logout,
    }),
    [user, isHydrating],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}
```

```tsx
import { AuthProvider } from '@/components/auth/AuthProvider';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans">
      <body>
        <ThemeProvider>
          <MSWProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </MSWProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Run the guard test again**

Run: `npm --workspace apps/frontend run test -- src/components/auth/AuthGuard.spec.tsx`

Expected: FAIL with module-not-found for `AuthGuard`

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/auth/AuthProvider.tsx apps/frontend/src/app/layout.tsx
git commit -m "feat(frontend): add auth provider root wiring"
```

## Task 3: Guarded Routing for Auth and App Groups

**Files:**
- Create: `apps/frontend/src/components/auth/AuthGuard.tsx`
- Create: `apps/frontend/src/components/auth/AuthGuard.spec.tsx`
- Modify: `apps/frontend/src/app/(auth)/layout.tsx`
- Modify: `apps/frontend/src/app/(app)/layout.tsx`
- Modify: `apps/frontend/src/app/layout-routing.spec.tsx`

- [ ] **Step 1: Extend tests to cover both guard modes and layout composition**

```tsx
it('redirects guests away from app pages', async () => {
  render(
    <AuthProvider>
      <AuthGuard mode="authenticated">
        <div>app page</div>
      </AuthGuard>
    </AuthProvider>,
  );

  await waitFor(() => {
    expect(replace).toHaveBeenCalledWith('/login');
  });
});

it('renders authenticated pages when a session exists', async () => {
  writeMockSession(createDemoSession({ email: 'demo@aibook.local', name: 'Demo Parent' }));

  render(
    <AuthProvider>
      <AuthGuard mode="authenticated">
        <div>app page</div>
      </AuthGuard>
    </AuthProvider>,
  );

  await waitFor(() => {
    expect(screen.getByText('app page')).toBeInTheDocument();
  });
});
```

```tsx
vi.mock('@/components/auth/AuthGuard', () => ({
  AuthGuard: ({
    mode,
    children,
  }: {
    mode: 'guest' | 'authenticated';
    children: React.ReactNode;
  }) => <div data-testid={`guard-${mode}`}>{children}</div>,
}));

it('wraps auth pages in the guest guard', async () => {
  const { default: AuthLayout } = await import('./(auth)/layout');
  render(
    <AuthLayout>
      <div>auth</div>
    </AuthLayout>,
  );

  expect(screen.getByTestId('guard-guest')).toBeInTheDocument();
});

it('wraps app pages in the authenticated guard and shell', async () => {
  const { default: AppLayout } = await import('./(app)/layout');
  render(
    <AppLayout>
      <div>internal</div>
    </AppLayout>,
  );

  expect(screen.getByTestId('guard-authenticated')).toBeInTheDocument();
  expect(screen.getByTestId('app-shell-mock')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm --workspace apps/frontend run test -- src/components/auth/AuthGuard.spec.tsx src/app/layout-routing.spec.tsx`

Expected: FAIL because `AuthGuard` is not implemented and layouts do not use it

- [ ] **Step 3: Implement the guard and wrap both route groups**

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function AuthGuard({
  mode,
  children,
}: {
  mode: 'guest' | 'authenticated';
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isHydrating } = useAuth();

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (mode === 'guest' && isAuthenticated) {
      router.replace('/');
      return;
    }

    if (mode === 'authenticated' && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isHydrating, mode, router]);

  if (isHydrating) {
    return null;
  }

  if (mode === 'guest' && isAuthenticated) {
    return null;
  }

  if (mode === 'authenticated' && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

```tsx
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AuthGroupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard mode="guest">
      <main className="min-h-screen flex items-center justify-center bg-muted/20 p-6">{children}</main>
    </AuthGuard>
  );
}
```

```tsx
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppShell } from '@/components/app-shell/AppShell';

export default function AppGroupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard mode="authenticated">
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
```

- [ ] **Step 4: Run the routing tests to verify they pass**

Run: `npm --workspace apps/frontend run test -- src/components/auth/AuthGuard.spec.tsx src/app/layout-routing.spec.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/auth/AuthGuard.tsx apps/frontend/src/components/auth/AuthGuard.spec.tsx apps/frontend/src/app/(auth)/layout.tsx apps/frontend/src/app/(app)/layout.tsx apps/frontend/src/app/layout-routing.spec.tsx
git commit -m "feat(frontend): guard auth and app route groups"
```

## Task 4: Login Page Tests and UI Rewrite

**Files:**
- Modify: `apps/frontend/src/components/auth/LoginForm.tsx`
- Modify: `apps/frontend/src/app/(auth)/auth-pages.spec.tsx`

- [ ] **Step 1: Expand the login page tests with Pencil states and demo copy**

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from './login/page';
import { AuthProvider } from '@/components/auth/AuthProvider';

describe('auth pages', () => {
  it('renders login demo helper copy and the secondary auth actions', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    expect(screen.getByText(/demo user/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Forgot password?' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/signup');
  });

  it('shows inline validation when login fields are empty', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Check your email and password.')).toBeInTheDocument();
  });

  it('shows the loading state and completes the demo login', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'demo@aibook.local' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Continuing...')).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.getItem('aibook.mock-auth-session')).toContain('demo@aibook.local');
    });
  });
});
```

- [ ] **Step 2: Run the auth page test to verify it fails**

Run: `npm --workspace apps/frontend run test -- 'src/app/(auth)/auth-pages.spec.tsx'`

Expected: FAIL because the current `LoginForm` lacks helper copy, validation state, and loading behavior

- [ ] **Step 3: Rewrite `LoginForm` to match the Pencil frame and provider flow**

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from './AuthProvider';

export function LoginForm() {
  const router = useRouter();
  const { loginDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.includes('@') || !password) {
      setError('Check your email and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    await loginDemo({ email, name: 'Demo Parent' });
    router.replace('/');
  }

  return (
    <Card className="w-full max-w-[430px] rounded-[22px] border-[#E3D5C2] bg-[#FFFDF8] py-7 shadow-[0_16px_34px_rgba(58,40,20,0.1)]">
      <CardHeader className="space-y-4 px-7">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-4xl bg-[#9B5E1A]" />
          <span className="font-heading text-[27px] font-semibold text-[#2F261D]">aiBook</span>
        </div>
        <div className="space-y-2">
          <CardTitle className="font-heading text-[34px] font-semibold text-[#2F261D]">Welcome back</CardTitle>
          <p className="text-sm text-[#75695B]">Sign in to continue your books.</p>
          <p className="text-xs text-[#75695B]">Demo user: `demo@aibook.local`. Submitting starts a local mock session.</p>
        </div>
      </CardHeader>
      <CardContent className="px-7">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm font-medium text-[#2F261D]">
            <span>Email</span>
            <Input aria-label="Email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="demo@aibook.local" className="h-11 rounded-xl border-[#E3D5C2]" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#2F261D]">
            <span>Password</span>
            <Input aria-label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="password123" className="h-11 rounded-xl border-[#E3D5C2]" />
          </label>

          {error ? (
            <div className="rounded-xl border border-[#B6483D] bg-[#FFF1ED] px-4 py-3 text-xs font-semibold text-[#B6483D]">
              Check your email and password.
            </div>
          ) : null}

          <Button type="submit" className="h-11 w-full rounded-xl bg-[#9B5E1A] text-white hover:bg-[#8A5216]" disabled={isSubmitting}>
            {isSubmitting ? 'Continuing...' : 'Continue'}
          </Button>
          <Button type="button" variant="outline" className="h-11 w-full rounded-xl border-[#E3D5C2]" disabled>
            Continue with Google
          </Button>
          <div className="flex items-center justify-between text-sm">
            <Button type="button" variant="link" className="h-auto p-0 text-[#9B5E1A]" disabled>
              Forgot password?
            </Button>
            <Link href="/signup" className="font-semibold text-[#9B5E1A] underline-offset-4 hover:underline">
              Create account
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run the auth page test again**

Run: `npm --workspace apps/frontend run test -- 'src/app/(auth)/auth-pages.spec.tsx'`

Expected: login-related tests PASS; signup-related tests may still FAIL until Task 5

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/auth/LoginForm.tsx apps/frontend/src/app/(auth)/auth-pages.spec.tsx
git commit -m "feat(frontend): implement guarded login demo flow"
```

## Task 5: Signup Page Tests and UI Rewrite

**Files:**
- Modify: `apps/frontend/src/components/auth/SignupForm.tsx`
- Modify: `apps/frontend/src/app/(auth)/auth-pages.spec.tsx`

- [ ] **Step 1: Add signup-specific failing tests**

```tsx
it('shows signup helper copy and the login footer link', () => {
  render(
    <AuthProvider>
      <SignupPage />
    </AuthProvider>,
  );

  expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
});

it('shows inline validation when signup data is invalid', async () => {
  render(
    <AuthProvider>
      <SignupPage />
    </AuthProvider>,
  );

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

  expect(screen.getByText('Complete all fields with a valid password.')).toBeInTheDocument();
});

it('shows the loading state and completes the demo signup', async () => {
  render(
    <AuthProvider>
      <SignupPage />
    </AuthProvider>,
  );

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

  expect(screen.getByText('Creating account...')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the auth page test to verify signup failures**

Run: `npm --workspace apps/frontend run test -- 'src/app/(auth)/auth-pages.spec.tsx'`

Expected: FAIL on signup-specific assertions

- [ ] **Step 3: Rewrite `SignupForm` to match the Pencil frame and provider flow**

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from './AuthProvider';

export function SignupForm() {
  const router = useRouter();
  const { signupDemo } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name || !email.includes('@') || password.length < 8) {
      setError('Complete all fields with a valid password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    await signupDemo({ name, email });
    router.replace('/');
  }

  return (
    <Card className="w-full max-w-[430px] rounded-[22px] border-[#E3D5C2] bg-[#FFFDF8] py-7 shadow-[0_16px_34px_rgba(58,40,20,0.1)]">
      <CardHeader className="space-y-4 px-7">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-4xl bg-[#9B5E1A]" />
          <span className="font-heading text-[27px] font-semibold text-[#2F261D]">aiBook</span>
        </div>
        <div className="space-y-2">
          <CardTitle className="font-heading text-[34px] font-semibold text-[#2F261D]">Create your account</CardTitle>
          <p className="text-sm text-[#75695B]">Start creating personalized keepsakes.</p>
        </div>
      </CardHeader>
      <CardContent className="px-7">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm font-medium text-[#2F261D]">
            <span>Name</span>
            <Input aria-label="Name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jane Doe" className="h-11 rounded-xl border-[#E3D5C2]" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#2F261D]">
            <span>Email</span>
            <Input aria-label="Email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jane@example.com" className="h-11 rounded-xl border-[#E3D5C2]" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#2F261D]">
            <span>Password</span>
            <Input aria-label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="password123" className="h-11 rounded-xl border-[#E3D5C2]" />
          </label>
          <p className="text-xs text-[#75695B]">Use at least 8 characters.</p>

          {error ? (
            <div className="rounded-xl border border-[#B6483D] bg-[#FFF1ED] px-4 py-3 text-xs font-semibold text-[#B6483D]">
              Complete all fields with a valid password.
            </div>
          ) : null}

          <Button type="submit" className="h-11 w-full rounded-xl bg-[#9B5E1A] text-white hover:bg-[#8A5216]" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-[#75695B]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#9B5E1A] underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run the auth page test to verify it passes**

Run: `npm --workspace apps/frontend run test -- 'src/app/(auth)/auth-pages.spec.tsx'`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/auth/SignupForm.tsx apps/frontend/src/app/(auth)/auth-pages.spec.tsx
git commit -m "feat(frontend): implement guarded signup demo flow"
```

## Task 6: Full Frontend Verification

**Files:**
- Verify only

- [ ] **Step 1: Run the focused auth test suite**

Run: `npm --workspace apps/frontend run test -- src/lib/mock-auth.spec.ts src/components/auth/AuthGuard.spec.tsx 'src/app/(auth)/auth-pages.spec.tsx' src/app/layout-routing.spec.tsx`

Expected: PASS

- [ ] **Step 2: Run the full frontend test suite**

Run: `npm --workspace apps/frontend run test`

Expected: PASS

- [ ] **Step 3: Run frontend build verification**

Run: `npm --workspace apps/frontend run build`

Expected: PASS

- [ ] **Step 4: Review the local app behavior manually**

Run: `npm run dev`

Manual checks:
- visiting `/login` as guest shows the login card
- successful login redirects to `/`
- visiting `/signup` as authenticated redirects to `/`
- clearing the mock session returns `(app)` routes to `/login`

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src
git commit -m "test(frontend): verify mock auth page flow"
```

## Self-Review

- Spec coverage check:
  - Pencil-aligned `/login` and `/signup` UI: Tasks 4 and 5
  - frontend-only mock session state: Tasks 1 and 2
  - route guards for `(auth)` and `(app)`: Task 3
  - demo user flow for local development and QA: Tasks 2, 4, and 6
  - tests for auth UI, session behavior, and guarded routing: Tasks 1, 3, 4, 5, and 6
- Placeholder scan:
  - no `TODO`, `TBD`, or unspecified “add validation later” steps remain
- Type consistency:
  - `MockAuthUser`, `loginDemo`, `signupDemo`, `logout`, and `AuthGuard mode="guest" | "authenticated"` are defined once and reused consistently

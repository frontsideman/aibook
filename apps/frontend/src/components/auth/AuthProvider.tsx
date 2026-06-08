'use client';

import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import {
  clearMockSession,
  createDemoSession,
  readMockSession,
  writeMockSession,
  type MockAuthUser,
} from '@/lib/mock-auth';

type LoginDemoInput = {
  email: string;
  name?: string;
};

type SignupDemoInput = {
  email: string;
  name: string;
};

type AuthContextValue = {
  user: MockAuthUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  loginDemo: (input: LoginDemoInput) => Promise<MockAuthUser>;
  signupDemo: (input: SignupDemoInput) => Promise<MockAuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockAuthUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    setUser(readMockSession());
    setIsHydrating(false);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isHydrating,
    loginDemo: async ({ email, name }) => {
      const session = createDemoSession({
        email,
        name: name ?? 'Demo Parent',
      });

      writeMockSession(session);
      setUser(session);

      return session;
    },
    signupDemo: async ({ email, name }) => {
      const session = createDemoSession({
        email,
        name,
      });

      writeMockSession(session);
      setUser(session);

      return session;
    },
    logout: () => {
      clearMockSession();
      setUser(null);
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

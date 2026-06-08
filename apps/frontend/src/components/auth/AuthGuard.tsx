'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth/AuthProvider';

type AuthGuardProps = {
  mode: 'guest' | 'authenticated';
  children: ReactNode;
};

export function AuthGuard({ mode, children }: AuthGuardProps) {
  const router = useRouter();
  const { isHydrating, user } = useAuth();

  const redirectTarget = mode === 'guest' ? (user ? '/' : null) : user ? null : '/login';

  useEffect(() => {
    if (!isHydrating && redirectTarget) {
      router.replace(redirectTarget);
    }
  }, [isHydrating, redirectTarget, router]);

  if (isHydrating || redirectTarget) {
    return null;
  }

  return <>{children}</>;
}

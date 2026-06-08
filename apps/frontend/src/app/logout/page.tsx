'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth/AuthProvider';

export default function LogoutPage() {
  const router = useRouter();
  const { isHydrating, logout } = useAuth();
  const hasLoggedOutRef = useRef(false);

  useEffect(() => {
    if (isHydrating || hasLoggedOutRef.current) {
      return;
    }

    hasLoggedOutRef.current = true;
    logout();
    router.replace('/login');
  }, [isHydrating, logout, router]);

  return (
    <main className='flex min-h-screen items-center justify-center p-6'>
      <p className='text-sm text-muted-foreground'>Signing out...</p>
    </main>
  );
}

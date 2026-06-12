import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AuthGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard mode='guest'>
      <main className='min-h-screen flex items-center justify-center p-4 bg-muted/20 md:p-6'>
        {children}
      </main>
    </AuthGuard>
  );
}

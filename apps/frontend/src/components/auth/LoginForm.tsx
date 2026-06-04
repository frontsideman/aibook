'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const router = useRouter();
  const { loginDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email) || password.trim().length === 0) {
      setError('Check your email and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await loginDemo({ email, name: 'Demo Parent' });
      router.replace('/');
    } catch {
      setError('Check your email and password.');
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/70">
      <CardHeader className="space-y-3">
        <CardTitle>Login</CardTitle>
        <p className="text-sm text-muted-foreground">
          Demo Parent access uses a local mock session for the approved provider flow.
        </p>
        <p className="text-xs text-muted-foreground">
          Use any valid email and password. Submit starts a local mock session on this device.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <p className="text-sm font-medium">Email</p>
            <Input
              aria-label="Email"
              aria-invalid={error ? 'true' : 'false'}
              autoComplete="email"
              disabled={isSubmitting}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) {
                  setError('');
                }
              }}
              placeholder="parent@example.com"
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Password</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground"
                disabled
              >
                Forgot password?
              </Button>
            </div>
            <Input
              aria-label="Password"
              aria-invalid={error ? 'true' : 'false'}
              autoComplete="current-password"
              disabled={isSubmitting}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) {
                  setError('');
                }
              }}
              placeholder="Enter your password"
              type="password"
              value={password}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Continuing...' : 'Continue'}
          </Button>
          <Button type="button" variant="outline" className="w-full" disabled>
            Continue with Google
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-foreground underline">
              Create account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

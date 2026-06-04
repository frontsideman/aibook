'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function SignupForm() {
  const router = useRouter();
  const { signupDemo } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      name.trim().length === 0 ||
      !isValidEmail(email) ||
      password.trim().length < 8
    ) {
      setError('Complete all fields with a valid password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await signupDemo({ name: name.trim(), email });
      router.replace('/');
    } catch {
      setError('Complete all fields with a valid password.');
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/70">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            ab
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-[0.18em] text-foreground/80 uppercase">
              aiBook
            </p>
            <p className="text-xs text-muted-foreground">
              Personalized story keepsakes for every family.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle>
            <h1>Create your account</h1>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Start creating personalized keepsakes.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Parent account details
              </p>
              <p className="text-xs text-muted-foreground">
                Your demo provider flow stays on this device until you log out.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Name</p>
              <Input
                aria-label="Name"
                aria-invalid={error ? 'true' : 'false'}
                autoComplete="name"
                disabled={isSubmitting}
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) {
                    setError('');
                  }
                }}
                placeholder="Jane Doe"
                type="text"
                value={name}
              />
            </div>
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
              <p className="text-sm font-medium">Password</p>
              <Input
                aria-label="Password"
                aria-invalid={error ? 'true' : 'false'}
                autoComplete="new-password"
                disabled={isSubmitting}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) {
                    setError('');
                  }
                }}
                placeholder="Create a password"
                type="password"
                value={password}
              />
              <p className="text-xs text-muted-foreground">
                Use at least 8 characters.
              </p>
            </div>
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground underline">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

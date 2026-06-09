'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Lock, Mail, X } from 'lucide-react';

import { useAuth } from '@/components/auth/AuthProvider';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export function LoginForm() {
  const router = useRouter();
  const { loginDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className='w-full max-w-[430px] rounded-[22px] border border-border bg-card p-7 shadow-[0_16px_34px_#3A28141A]'>
      <BrandMark className='mb-[18px]' />

      <h1 className='font-display text-[34px] font-semibold text-foreground'>Welcome back</h1>

      <p className='mt-[18px] text-sm text-muted-foreground'>Sign in to continue your books.</p>

      <form className='mt-[18px] space-y-[14px]' onSubmit={handleSubmit}>
        <div className='space-y-1.5'>
          <label htmlFor='login-email' className='text-[13px] font-extrabold text-foreground'>
            Email
          </label>
          <div className='relative'>
            <Mail className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              id='login-email'
              aria-label='Email'
              type='email'
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError('');
              }}
              placeholder='parent@example.com'
              className='pl-9'
              autoComplete='email'
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className='space-y-1.5'>
          <label htmlFor='login-password' className='text-[13px] font-extrabold text-foreground'>
            Password
          </label>
          <div className='relative'>
            <Lock className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              id='login-password'
              aria-label='Password'
              type='password'
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError('');
              }}
              placeholder='Enter your password'
              className='pl-9'
              autoComplete='current-password'
              disabled={isSubmitting}
              aria-invalid={!!error}
            />
          </div>
        </div>

        {error && (
          <div className='flex items-center gap-2.5 rounded-[12px] border border-destructive bg-destructive/10 p-3'>
            <X className='size-4 shrink-0 text-destructive' />
            <span className='text-xs font-bold text-destructive' role='alert'>
              {error}
            </span>
          </div>
        )}

        <Button type='submit' className='w-full' loading={isSubmitting}>
          {isSubmitting ? undefined : 'Continue'}
        </Button>

        <Button
          type='button'
          variant='outline'
          className='w-full bg-card'
          aria-label='Continue with Google'
        >
          <span className='text-[15px] font-extrabold text-primary'>G</span>
          Continue with Google
        </Button>

        <div className='flex items-center justify-between'>
          <Link href='/forgot-password' className='text-[13px] font-extrabold text-primary'>
            Forgot password?
          </Link>
          <Link href='/signup' className='text-[13px] font-extrabold text-primary'>
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}

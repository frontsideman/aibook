'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Lock, Mail, User, X } from 'lucide-react';

import { useAuth } from '@/components/auth/AuthProvider';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
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

    if (name.trim().length === 0 || !isValidEmail(email) || password.trim().length < 8) {
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
    <div className='w-full max-w-[430px] rounded-[22px] border border-border bg-card p-7 shadow-[0_16px_34px_#3A28141A]'>
      <BrandMark className='mb-[18px]' />

      <h1 className='font-display text-[34px] font-semibold text-foreground'>
        Create your account
      </h1>

      <p className='mt-[18px] text-sm text-muted-foreground'>
        Start creating personalized keepsakes.
      </p>

      <form className='mt-[18px] space-y-[14px]' onSubmit={handleSubmit}>
        <div className='space-y-1.5'>
          <label className='text-[13px] font-extrabold text-foreground'>Name</label>
          <div className='relative'>
            <User className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              aria-label='Name'
              type='text'
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError('');
              }}
              placeholder='Jane Doe'
              className='pl-9'
              autoComplete='name'
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className='space-y-1.5'>
          <label className='text-[13px] font-extrabold text-foreground'>Email</label>
          <div className='relative'>
            <Mail className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
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
          <label className='text-[13px] font-extrabold text-foreground'>Password</label>
          <div className='relative'>
            <Lock className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              aria-label='Password'
              type='password'
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError('');
              }}
              placeholder='Create a password'
              className='pl-9'
              autoComplete='new-password'
              disabled={isSubmitting}
              aria-invalid={!!error}
            />
          </div>
          <p className='text-xs text-muted-foreground'>Use at least 8 characters.</p>
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
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>

        <div className='flex items-center justify-center gap-1.5 text-[13px]'>
          <span className='text-muted-foreground'>Already have an account?</span>
          <Link href='/login' className='font-extrabold text-primary'>
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}

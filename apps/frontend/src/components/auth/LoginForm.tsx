'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Lock, Mail, X } from 'lucide-react';

import { useAuth } from '@/components/auth/AuthProvider';

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
    <div className="w-full max-w-[430px] rounded-[22px] border border-[#E3D5C2] bg-[#FFFDF8] p-7 shadow-[0_16px_34px_-14px_#3A28141A]">
      <div className="mb-[18px] flex items-center gap-2.5">
        <div className="size-[34px] rounded-[9px] bg-[#9B5E1A]" />
        <span className="font-display text-[27px] font-semibold text-[#2F261D]">
          aiBook
        </span>
      </div>

      <h1 className="font-display text-[34px] font-semibold text-[#2F261D]">
        Welcome back
      </h1>

      <p className="mt-1 text-sm text-[#75695B]">
        Sign in to continue your books.
      </p>

      <form className="mt-[18px] space-y-[14px]" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[13px] font-extrabold text-[#2F261D]">
            Email
          </label>
          <div className="flex h-[46px] items-center gap-2 rounded-[11px] border border-[#E3D5C2] bg-[#FFF9F0] px-3 focus-within:border-[#3D6C8D] focus-within:ring-1 focus-within:ring-[#3D6C8D]">
            <Mail className="size-4 shrink-0 text-[#75695B]" />
            <input
              aria-label="Email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError('');
              }}
              placeholder="parent@example.com"
              className="h-full flex-1 bg-transparent text-sm text-[#2F261D] placeholder:text-[#75695B] outline-none"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-extrabold text-[#2F261D]">
            Password
          </label>
          <div
            className={`flex h-[46px] items-center gap-2 rounded-[11px] bg-[#FFF9F0] px-3 focus-within:ring-1 focus-within:ring-[#3D6C8D] ${
              error
                ? 'border border-[#B6483D]'
                : 'border border-[#E3D5C2]'
            }`}
          >
            <Lock className="size-4 shrink-0 text-[#75695B]" />
            <input
              aria-label="Password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError('');
              }}
              placeholder="Enter your password"
              className="h-full flex-1 bg-transparent text-sm text-[#2F261D] placeholder:text-[#75695B] outline-none"
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-[12px] border border-[#B6483D] bg-[#FFF1ED] p-3">
            <X className="size-4 shrink-0 text-[#B6483D]" />
            <span className="text-xs font-bold text-[#B6483D]" role="alert">
              {error}
            </span>
          </div>
        )}

        {isSubmitting ? (
          <button
            type="submit"
            disabled
            className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#9B5E1A] text-[13px] font-extrabold text-white opacity-85"
          >
            <span className="size-2.5 animate-pulse rounded-full bg-white/70" />
            Continuing...
          </button>
        ) : (
          <button
            type="submit"
            className="flex h-[46px] w-full items-center justify-center rounded-[12px] bg-[#9B5E1A] text-[15px] font-extrabold text-white"
          >
            Continue
          </button>
        )}

        <button
          type="button"
          disabled
          aria-label="Continue with Google"
          className="flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[12px] border border-[#E3D5C2] bg-transparent text-sm font-extrabold text-[#2F261D] opacity-50"
        >
          <span className="text-[15px] font-extrabold text-[#9B5E1A]">G</span>
          Continue with Google
        </button>

        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled
            className="text-[13px] font-extrabold text-[#9B5E1A] opacity-50"
          >
            Forgot password?
          </button>
          <Link
            href="/signup"
            className="text-[13px] font-extrabold text-[#9B5E1A]"
          >
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}

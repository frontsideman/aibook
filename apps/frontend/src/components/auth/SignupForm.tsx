'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Mail, Lock, User, X } from 'lucide-react';

import { useAuth } from '@/components/auth/AuthProvider';

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
    <div className="w-full max-w-[430px] rounded-[22px] border border-[#E3D5C2] bg-[#FFFDF8] p-7 shadow-[0_16px_34px_-14px_#3A28141A]">
      <div className="mb-[18px] flex items-center gap-2.5">
        <div className="size-[34px] rounded-[9px] bg-[#9B5E1A]" />
        <span className="font-display text-[27px] font-semibold text-[#2F261D]">
          aiBook
        </span>
      </div>

      <h1 className="font-display text-[34px] font-semibold text-[#2F261D]">
        Create your account
      </h1>

      <p className="mt-1 text-sm text-[#75695B]">
        Start creating personalized keepsakes.
      </p>

      <form className="mt-[18px] space-y-[14px]" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[13px] font-extrabold text-[#2F261D]">
            Name
          </label>
          <div className="flex h-[46px] items-center gap-2 rounded-[11px] border border-[#E3D5C2] bg-[#FFF9F0] px-3 focus-within:border-[#3D6C8D] focus-within:ring-1 focus-within:ring-[#3D6C8D]">
            <User className="size-4 shrink-0 text-[#75695B]" />
            <input
              aria-label="Name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError('');
              }}
              placeholder="Jane Doe"
              className="h-full flex-1 bg-transparent text-sm text-[#2F261D] placeholder:text-[#75695B] outline-none"
              autoComplete="name"
              disabled={isSubmitting}
            />
          </div>
        </div>

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
          <div className="flex h-[46px] items-center gap-2 rounded-[11px] border border-[#E3D5C2] bg-[#FFF9F0] px-3 focus-within:border-[#3D6C8D] focus-within:ring-1 focus-within:ring-[#3D6C8D]">
            <Lock className="size-4 shrink-0 text-[#75695B]" />
            <input
              aria-label="Password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError('');
              }}
              placeholder="Create a password"
              className="h-full flex-1 bg-transparent text-sm text-[#2F261D] placeholder:text-[#75695B] outline-none"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </div>
          <p className="text-xs text-[#75695B]">Use at least 8 characters.</p>
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
            Creating account...
          </button>
        ) : (
          <button
            type="submit"
            className="flex h-[46px] w-full items-center justify-center rounded-[12px] bg-[#9B5E1A] text-[15px] font-extrabold text-white"
          >
            Create account
          </button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[13px]">
          <span className="text-[#75695B]">Already have an account?</span>
          <Link href="/login" className="font-extrabold text-[#9B5E1A]">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}

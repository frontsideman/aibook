import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className='w-full max-w-[430px] rounded-[22px] border border-border bg-card p-7 shadow-[0_16px_34px_#3A28141A]'>
      <p className='font-mono text-xs font-extrabold uppercase tracking-[0.12em] text-primary'>
        ACCOUNT
      </p>
      <h1 className='mt-2 font-display text-[34px] font-semibold text-foreground'>
        Password reset
      </h1>
      <p className='mt-4 text-sm text-muted-foreground'>
        This demo uses a local mock session, so password reset is not available yet. Sign in with
        any valid email and password, or create an account.
      </p>
      <div className='mt-6 flex gap-3'>
        <Link
          href='/login'
          className='inline-flex h-10 items-center rounded-[10px] bg-primary px-4 text-sm font-extrabold text-primary-foreground hover:opacity-90'
        >
          Back to login
        </Link>
        <Link
          href='/signup'
          className='inline-flex h-10 items-center rounded-[10px] border border-border bg-background px-4 text-sm font-extrabold text-foreground hover:bg-secondary'
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

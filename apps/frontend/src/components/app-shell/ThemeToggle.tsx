'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='flex h-12 items-center justify-between rounded-xl border border-border bg-secondary px-2.5'>
        <span className='text-[13px] font-semibold text-foreground'>Theme</span>
        <div className='flex h-8 items-center gap-0.5 rounded-[10px] bg-background p-0.5 ring-1 ring-border'>
          <div className='flex h-full items-center justify-center rounded-[7px] bg-primary px-3'>
            <span className='text-[11px] font-bold text-white'>Light</span>
          </div>
          <div className='flex h-full items-center justify-center rounded-[7px] px-3'>
            <span className='text-[11px] font-bold text-muted-foreground'>Dark</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-12 items-center justify-between rounded-xl border border-border bg-secondary px-2.5'>
      <span className='text-[13px] font-semibold text-foreground'>Theme</span>
      <div className='flex h-8 items-center gap-0.5 rounded-[10px] bg-background p-0.5 ring-1 ring-border'>
        <button
          type='button'
          onClick={() => setTheme('light')}
          className={cn(
            'flex h-full items-center justify-center rounded-[7px] px-3 transition-colors',
            resolvedTheme === 'light'
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span className='text-[11px] font-bold'>Light</span>
        </button>
        <button
          type='button'
          onClick={() => setTheme('dark')}
          className={cn(
            'flex h-full items-center justify-center rounded-[7px] px-3 transition-colors',
            resolvedTheme === 'dark'
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span className='text-[11px] font-bold'>Dark</span>
        </button>
      </div>
    </div>
  );
}

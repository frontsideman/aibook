'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';

type MobileHeaderProps = {
  onMenuToggle: () => void;
};

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  return (
    <header className='fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center justify-between border-b border-border bg-card px-4 md:hidden'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='size-10'
        onClick={onMenuToggle}
        aria-label='Open menu'
      >
        <Menu className='size-6' />
      </Button>
      <Link href='/' className='font-display text-xl font-bold text-primary'>
        aiBook
      </Link>
      <div className='w-10' /> {/* Spacer for centering */}
    </header>
  );
}

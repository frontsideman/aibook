'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Plus } from 'lucide-react';
import { navItems } from '@/components/app-shell/nav-items';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

function getPageLabel(pathname: string): string | null {
  const navItem = navItems.find((item) => item.href === pathname);
  if (navItem) return navItem.label;

  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return null;

  if (segments[0] === 'books' && segments.length >= 2 && last !== 'new') {
    return 'Book';
  }

  return last.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LibraryTopHeader() {
  const pathname = usePathname();
  const currentPage = getPageLabel(pathname);

  return (
    <header className='flex h-[64px] w-full items-center justify-between border-b border-border bg-card px-[28px]'>
      <div className='flex items-center gap-2'>
        <BreadcrumbList className='gap-[8px]'>
          <BreadcrumbItem className='hidden md:block'>
            <BreadcrumbLink href='/' className='text-[13px] font-semibold text-muted-foreground'>
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentPage && pathname !== '/' && (
            <>
              <BreadcrumbSeparator className='hidden md:block text-muted-foreground' />
              <BreadcrumbItem>
                <BreadcrumbPage className='text-[13px] font-extrabold text-foreground'>
                  {currentPage}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </div>

      <div className='flex items-center gap-[10px]'>
        <Link
          href='/notifications'
          className='flex h-[40px] w-[40px] items-center justify-center rounded-[10px] border border-border bg-background transition-colors hover:bg-secondary'
          aria-label='Notifications'
        >
          <Bell className='h-[18px] w-[18px] text-muted-foreground' aria-hidden='true' />
        </Link>

        <Link
          href='/books/new'
          className='flex h-[40px] items-center gap-[8px] rounded-[10px] bg-primary px-[14px] text-[14px] font-extrabold text-primary-foreground transition-colors hover:opacity-90'
        >
          <Plus className='h-[16px] w-[16px]' aria-hidden='true' />
          <span>Create book</span>
        </Link>
      </div>
    </header>
  );
}

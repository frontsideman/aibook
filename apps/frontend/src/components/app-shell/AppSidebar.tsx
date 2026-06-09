'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { LogOut } from 'lucide-react';

import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

import { ThemeToggle } from './ThemeToggle';
import { navItems } from './nav-items';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar
      {...props}
      className={cn(
        'w-[244px] border-r border-border bg-card md:sticky md:top-0 md:h-screen',
        props.className
      )}
    >
      <div className='flex h-full min-h-0 flex-col p-[18px]'>
        {/* Brand */}
        <div className='flex shrink-0 items-center gap-[10px]'>
          <div className='size-9 rounded-4xl bg-primary' />
          <span className='font-display text-[27px] font-semibold text-foreground'>aiBook</span>
        </div>

        {/* Navigation */}
        <SidebarContent className='min-h-0'>
          <nav className='flex flex-col gap-[4px]'>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-[10px] rounded-[10px] px-[12px] h-11 transition-colors border border-transparent',
                    isActive
                      ? 'bg-secondary text-foreground hover:border-border'
                      : 'hover:border-secondary'
                  )}
                >
                  <item.icon
                    className={cn(
                      'size-[18px] shrink-0 hover:text-primary',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[14px] leading-tight',
                      isActive ? 'font-bold' : 'font-medium'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </SidebarContent>

        <div
          data-slot='sidebar-footer'
          className='mt-auto flex shrink-0 flex-col gap-[18px] pt-[18px]'
        >
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Account */}
          <div className='flex h-[68px] items-center gap-[10px] rounded-xl border border-border bg-secondary p-[12px]'>
            <div className='size-[34px] shrink-0 rounded-full bg-accent' />
            <div className='flex flex-col gap-[2px]'>
              <span className='text-[13px] font-extrabold text-foreground'>Sarah K.</span>
              <span className='text-[12px] leading-none text-muted-foreground'>Family plan</span>
            </div>
          </div>

          {/* Logout */}
          <Link
            href='/logout'
            className={cn(
              'flex h-[42px] w-full items-center gap-[8px] rounded-[10px] border border-border bg-background px-[12px] text-[13px] font-bold text-destructive transition-colors hover:bg-secondary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
          >
            <LogOut className='size-4 shrink-0' />
            <span>Logout</span>
          </Link>
        </div>

        <SidebarRail />
      </div>
    </Sidebar>
  );
}

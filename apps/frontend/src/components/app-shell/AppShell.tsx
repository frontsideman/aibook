'use client';

import { useState } from 'react';

import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';
import { MobileDrawer } from './MobileDrawer';
import { PageBreadcrumb } from './PageBreadcrumb';
import { useHeader } from './HeaderContext';

export function AppShell({ children }: { children: ReactNode }) {
  const { header } = useHeader();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SidebarProvider>
      <MobileHeader onMenuToggle={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      {/* Desktop/Tablet sidebar - hidden on mobile */}
      <div className='hidden md:block'>
        <AppSidebar />
      </div>
      
      <SidebarInset className='bg-background'>
        {header ? (
          header
        ) : (
          <header className='hidden md:flex h-16 shrink-0 items-center bg-background gap-2 border-b px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
            <PageBreadcrumb />
          </header>
        )}
        <main className={cn(
          'min-w-0 p-5 md:p-7 lg:p-6 pt-[76px] md:pt-0',
          !header && 'p-4 md:p-4 lg:p-6'
        )}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

'use client';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side='left' className='w-[244px] p-0' aria-describedby='mobile-drawer-description'>
        <SheetTitle className='sr-only'>Navigation menu</SheetTitle>
        <span id='mobile-drawer-description' className='sr-only'>
          Side navigation menu for mobile devices
        </span>
        <AppSidebar onNavigate={onClose} />
      </SheetContent>
    </Sheet>
  );
}

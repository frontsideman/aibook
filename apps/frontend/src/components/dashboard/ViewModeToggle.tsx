'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Table, LayoutGrid } from 'lucide-react';

type ViewMode = 'grid' | 'list';

type ViewModeToggleProps = {
  viewMode: ViewMode;
};

export default function ViewModeToggle({ viewMode }: ViewModeToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setViewMode = (nextView: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', nextView);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const tableActive = viewMode === 'grid';
  const cardsActive = viewMode === 'list';

  return (
    <div
      className='inline-flex gap-[4px] rounded-[12px] border border-border bg-secondary p-[4px]'
      role='group'
      aria-label='View mode'
    >
      <button
        type='button'
        onClick={() => setViewMode('grid')}
        aria-pressed={tableActive}
        className={`inline-flex h-9 items-center gap-[7px] rounded-[9px] px-[12px] text-[13px] font-extrabold transition ${
          tableActive
            ? 'border border-border bg-background text-primary'
            : 'bg-transparent text-muted-foreground'
        }`}
      >
        <Table className='h-4 w-4' aria-hidden='true' />
        <span>Table</span>
      </button>
      <button
        type='button'
        onClick={() => setViewMode('list')}
        aria-pressed={cardsActive}
        className={`inline-flex h-9 items-center gap-[7px] rounded-[9px] px-[12px] text-[13px] font-extrabold transition ${
          cardsActive
            ? 'border border-border bg-background text-primary'
            : 'bg-transparent text-muted-foreground'
        }`}
      >
        <LayoutGrid className='h-4 w-4' aria-hidden='true' />
        <span>Cards</span>
      </button>
    </div>
  );
}

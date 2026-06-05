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

  return (
    <div
      className="inline-flex rounded-xl border border-border bg-card p-1"
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => setViewMode('grid')}
        aria-pressed={viewMode === 'grid'}
        className={`inline-flex h-9 items-center gap-[7px] rounded-[9px] px-3 text-[13px] font-extrabold transition ${
          viewMode === 'grid'
            ? 'border border-border bg-surface text-foreground'
            : 'bg-transparent text-muted-foreground'
        }`}
      >
        <Table className="h-4 w-4" aria-hidden="true" />
        <span>Table</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode('list')}
        aria-pressed={viewMode === 'list'}
        className={`inline-flex h-9 items-center gap-[7px] rounded-[9px] px-3 text-[13px] font-extrabold transition ${
          viewMode === 'list'
            ? 'border border-border bg-surface text-foreground'
            : 'bg-transparent text-muted-foreground'
        }`}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        <span>Cards</span>
      </button>
    </div>
  );
}

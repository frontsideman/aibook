'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
    <div className="inline-flex rounded-xl border border-border/80 bg-card p-1" role="group" aria-label="View mode">
      <button
        type="button"
        onClick={() => setViewMode('grid')}
        aria-pressed={viewMode === 'grid'}
        className={`rounded-lg px-3 py-1.5 text-sm ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
      >
        Grid
      </button>
      <button
        type="button"
        onClick={() => setViewMode('list')}
        aria-pressed={viewMode === 'list'}
        className={`rounded-lg px-3 py-1.5 text-sm ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
      >
        List
      </button>
    </div>
  );
}

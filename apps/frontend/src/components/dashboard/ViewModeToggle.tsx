'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
      <Button
        type="button"
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('grid')}
        aria-pressed={viewMode === 'grid'}
      >
        Grid
      </Button>
      <Button
        type="button"
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('list')}
        aria-pressed={viewMode === 'list'}
      >
        List
      </Button>
    </div>
  );
}

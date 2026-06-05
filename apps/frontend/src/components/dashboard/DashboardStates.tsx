'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

type DashboardErrorStateProps = {
  onRetry: () => void;
};

export function DashboardLoadingState() {
  return (
    <div className="rounded-2xl border border-info bg-info/10 p-4" data-testid="loading-state">
      <p className="mb-2 text-[15px] font-extrabold text-info">Loading</p>
      <p className="mb-3 text-[13px] text-foreground">Fetching your latest book statuses.</p>
      <div className="flex flex-col gap-2.5">
        <div className="h-2.5 w-[220px] rounded-[5px] bg-info/20" />
        <div className="h-2.5 w-[300px] rounded-[5px] bg-info/20" />
        <div className="h-2.5 w-[180px] rounded-[5px] bg-info/20" />
      </div>
    </div>
  );
}

export function DashboardErrorState({ onRetry }: DashboardErrorStateProps) {
  return (
    <div className="rounded-2xl border border-destructive bg-destructive/10 p-4" data-testid="error-state">
      <p className="mb-2 text-[15px] font-extrabold text-destructive">Error</p>
      <p className="mb-4 text-[13px] text-foreground">
        Book library failed to load. Retry keeps current filters.
      </p>
      <Button type="button" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function DashboardEmptyState() {
  return (
    <div className="rounded-2xl border border-primary bg-primary/10 p-4" data-testid="empty-state">
      <p className="mb-2 text-[15px] font-extrabold text-primary">Empty</p>
      <p className="mb-4 text-[13px] text-foreground">
        No books match these filters. Create a new story or clear filters.
      </p>
      <Button asChild>
        <Link href="/books/new">Create your first book</Link>
      </Button>
    </div>
  );
}

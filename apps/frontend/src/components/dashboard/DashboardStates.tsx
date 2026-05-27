'use client';

import Link from 'next/link';

type DashboardErrorStateProps = {
  onRetry: () => void;
};

export function DashboardLoadingState() {
  return <p className="text-muted-foreground">Loading books...</p>;
}

export function DashboardErrorState({ onRetry }: DashboardErrorStateProps) {
  return (
    <div className="paper-card py-16 text-center">
      <p className="mb-4 text-muted-foreground">Could not load books.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl border border-border/80 bg-card px-4 py-2 text-sm hover:bg-secondary"
      >
        Retry
      </button>
    </div>
  );
}

export function DashboardEmptyState() {
  return (
    <div className="paper-card py-16 text-center">
      <p className="mb-4 text-muted-foreground">No books found</p>
      <Link href="/books/new" className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Create your first book
      </Link>
    </div>
  );
}

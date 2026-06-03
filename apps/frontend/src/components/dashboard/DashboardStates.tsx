'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
      <Button type="button" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function DashboardEmptyState() {
  return (
    <div className="paper-card py-16 text-center">
      <p className="mb-4 text-muted-foreground">No books found</p>
      <Button asChild>
        <Link href="/books/new">Create your first book</Link>
      </Button>
    </div>
  );
}

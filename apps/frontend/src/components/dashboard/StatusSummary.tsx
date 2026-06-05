'use client';

import type { DashboardBookStatus } from '@/lib/books-view-model';

type StatusSummaryProps = {
  counts: Record<DashboardBookStatus, number>;
};

const STATUS_CONFIG: {
  key: DashboardBookStatus;
  label: string;
  colorClass: string;
}[] = [
  { key: 'DRAFT', label: 'DRAFT', colorClass: 'text-muted-foreground' },
  { key: 'GENERATING', label: 'GENERATING', colorClass: 'text-info' },
  { key: 'REVIEW', label: 'REVIEW', colorClass: 'text-warning' },
  { key: 'COMPLETED', label: 'COMPLETED', colorClass: 'text-success' },
];

export default function StatusSummary({ counts }: StatusSummaryProps) {
  return (
    <div className="flex gap-3.5" data-testid="status-summary">
      {STATUS_CONFIG.map(({ key, label, colorClass }) => (
        <div
          key={key}
          className="flex min-w-[120px] flex-1 flex-col gap-1.5 rounded-[14px] border border-border bg-surface p-3.5"
          data-testid={`status-card-${key}`}
        >
          <span className={`font-mono text-[11px] font-extrabold uppercase tracking-wider ${colorClass}`}>
            {label}
          </span>
          <span className="font-display text-[36px] font-semibold leading-none text-foreground">
            {counts[key] ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}

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
    <div className='grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-[14px]' data-testid='status-summary'>
      {STATUS_CONFIG.map(({ key, label, colorClass }) => (
        <div
          key={key}
          className='flex min-w-0 flex-col gap-[5px] rounded-[14px] border border-border bg-card p-3 md:min-w-[120px] md:p-[14px]'
          data-testid={`status-card-${key}`}
        >
          <span className={`font-mono text-[10px] font-extrabold md:text-[11px] ${colorClass}`}>{label}</span>
          <span className='font-display text-[28px] font-medium leading-none text-foreground md:text-[36px]'>
            {counts[key] ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}

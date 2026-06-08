import * as React from 'react';

import { cn } from '@/lib/utils';

function MetricsCard({
  label,
  value,
  trend,
  className,
}: {
  label: string;
  value: string;
  trend?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-center gap-1 rounded-[14px] border border-border/80 bg-card p-5',
        className
      )}
      style={{ height: '110px' }}
    >
      <span className='font-display text-[42px] font-semibold leading-none text-foreground'>
        {value}
      </span>
      <span className='text-[13px] text-muted-foreground'>
        {label}
        {trend && <span className='ml-1.5 text-[13px] text-success'>{trend}</span>}
      </span>
    </div>
  );
}

export { MetricsCard };

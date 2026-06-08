import * as React from 'react';
import { Circle, CircleAlert, CircleCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

const variantConfig = {
  generating: {
    border: 'border-info/40',
    dot: 'text-info',
    Icon: Circle,
  },
  review: {
    border: 'border-warning/40',
    dot: 'text-warning',
    Icon: CircleAlert,
  },
  completed: {
    border: 'border-success/40',
    dot: 'text-success',
    Icon: CircleCheck,
  },
};

function StateCard({
  variant,
  title,
  description,
  className,
}: {
  variant: 'generating' | 'review' | 'completed';
  title: string;
  description: string;
  className?: string;
}) {
  const cfg = variantConfig[variant];
  const { Icon } = cfg;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[14px] border bg-card p-[14px]',
        cfg.border,
        className
      )}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', cfg.dot)} />
      <div className='flex flex-col gap-0.5'>
        <span className='text-sm font-extrabold text-foreground'>{title}</span>
        <span className='text-[13px] leading-snug text-muted-foreground'>{description}</span>
      </div>
    </div>
  );
}

export { StateCard };

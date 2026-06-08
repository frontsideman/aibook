'use client';

type ProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  percent: number;
};

export function ProgressBar({ currentStep, totalSteps, stepLabel, percent }: ProgressBarProps) {
  return (
    <div className='rounded-2xl border border-border bg-card p-3.5 h-[82px]'>
      <div className='flex items-center justify-between'>
        <span className='font-sans text-[13px] font-extrabold text-foreground'>
          Book creation progress
        </span>
        <span className='font-sans text-[12px] font-bold text-primary'>{percent}%</span>
      </div>

      <div className='mt-2.5 h-3 rounded-lg bg-input ring-1 ring-border overflow-hidden'>
        <div
          className='h-full rounded-lg bg-primary transition-all duration-500 ease-in-out'
          style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

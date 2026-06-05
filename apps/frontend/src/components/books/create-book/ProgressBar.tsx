'use client';

import { cn } from '@/lib/utils';

type ProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  percent: number;
};

export function ProgressBar({
  currentStep,
  totalSteps,
  stepLabel,
  percent,
}: ProgressBarProps) {
  return (
    <div className="rounded-2xl border border-ab-border bg-ab-card p-3.5">
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[13px] font-extrabold tracking-wide text-ab-text"
        >
          Book creation progress
        </span>
        <span className="text-[12px] font-bold text-ab-primary">
          {percent}%
        </span>
      </div>

      <div className="mt-2.5 h-3 rounded-lg bg-ab-surface ring-1 ring-ab-border overflow-hidden">
        <div
          className="h-full rounded-lg bg-ab-primary transition-all duration-500 ease-in-out"
          style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-ab-muted">
          Current: {stepLabel}
        </span>
        <span className="text-[11px] font-bold text-ab-muted">
          {currentStep} of {totalSteps}
        </span>
      </div>
    </div>
  );
}

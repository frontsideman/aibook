import { cn } from '@/lib/utils';

type SettingsStaticFieldProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: 'default' | 'danger';
  className?: string;
};

export default function SettingsStaticField({
  label,
  value,
  detail,
  tone = 'default',
  className,
}: SettingsStaticFieldProps) {
  const isDanger = tone === 'danger';

  return (
    <div className={cn('space-y-2', className)}>
      <label className={cn('text-sm font-medium', isDanger && 'text-destructive')}>{label}</label>
      <input
        type='text'
        disabled
        readOnly
        value={value}
        aria-label={label}
        className={cn(
          'h-[44px] w-full rounded-[10px] border border-input bg-input-bg px-3 text-sm text-foreground opacity-80 outline-none disabled:cursor-not-allowed disabled:opacity-80 dark:bg-input-bg/30',
          isDanger && 'border-destructive/30 bg-destructive/5 text-destructive/90'
        )}
      />
      {detail ? <p className='text-xs text-muted-foreground'>{detail}</p> : null}
    </div>
  );
}

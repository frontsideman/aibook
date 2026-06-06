import { cn } from "@/lib/utils";

type SettingsToggleRowProps = {
  title: string;
  body: string;
  enabled: boolean;
  className?: string;
};

export default function SettingsToggleRow({
  title,
  body,
  enabled,
  className,
}: SettingsToggleRowProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-[14px] border border-border/70 bg-background/60 p-4",
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        disabled
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-not-allowed items-center rounded-full border transition-colors",
          enabled
            ? "border-foreground/20 bg-foreground/80"
            : "border-border bg-muted",
          "disabled:opacity-100",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-card shadow-sm transition-transform",
            enabled ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

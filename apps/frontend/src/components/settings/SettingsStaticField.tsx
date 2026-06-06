import { cn } from "@/lib/utils";

type SettingsStaticFieldProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "danger";
  className?: string;
};

export default function SettingsStaticField({
  label,
  value,
  detail,
  tone = "default",
  className,
}: SettingsStaticFieldProps) {
  const isDanger = tone === "danger";

  return (
    <div className={cn("space-y-2", className)}>
      <p className={cn("text-sm font-medium", isDanger && "text-destructive")}>
        {label}
      </p>
      <div
        role="textbox"
        aria-readonly="true"
        aria-disabled="true"
        className={cn(
          "flex min-h-[44px] items-center rounded-[10px] border border-input bg-input-bg px-3 text-sm text-foreground opacity-80 dark:bg-input-bg/30",
          isDanger && "border-destructive/30 bg-destructive/5 text-destructive/90",
        )}
      >
        {value}
      </div>
      {detail ? (
        <p className="text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SettingsPanelProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "danger";
  title?: string;
  description?: string;
};

export default function SettingsPanel({
  children,
  className,
  tone = "default",
  title,
  description,
}: SettingsPanelProps) {
  const isDanger = tone === "danger";

  return (
    <section
      className={cn(
        "rounded-[18px] border bg-card p-6 shadow-[0_1px_0_rgba(15,23,42,0.04)]",
        isDanger && "border-destructive/25 bg-destructive/5",
        className,
      )}
    >
      {title || description ? (
        <header className="mb-5 space-y-2">
          {title ? (
            <h2
              className={cn(
                "font-heading text-xl font-semibold",
                isDanger && "text-destructive",
              )}
            >
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

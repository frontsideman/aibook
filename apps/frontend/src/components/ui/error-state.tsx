import * as React from "react"
import { TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

function ErrorState({
  message,
  action,
  className,
}: {
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-[12px] border border-destructive bg-[#FFF1ED] p-3",
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-destructive">{message}</span>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

export { ErrorState }

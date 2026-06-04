import * as React from "react"

import { cn } from "@/lib/utils"

function BrandMark({
  className,
  showName = true,
  size = "md",
}: {
  className?: string;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: { box: "size-[26px]", rounded: "rounded-[7px]", icon: 14, text: "text-[20px]" },
    md: { box: "size-[34px]", rounded: "rounded-[9px]", icon: 18, text: "text-[27px]" },
    lg: { box: "size-[44px]", rounded: "rounded-[11px]", icon: 24, text: "text-[34px]" },
  }

  const s = sizeMap[size]

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("flex items-center justify-center bg-[#9B5E1A]", s.box, s.rounded)}>
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 19.5Z" />
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        </svg>
      </div>
      {showName && (
        <span
          className={cn(
            "font-display font-semibold text-[#2F261D]",
            s.text,
          )}
        >
          aiBook
        </span>
      )}
    </div>
  )
}

export { BrandMark }

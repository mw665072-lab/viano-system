import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Skeleton placeholder block. Pulses and adapts to light/dark themes.
 * Light: subtle gray (`bg-gray-200`); Dark: translucent white (`bg-white/10`).
 * Compose multiple of these to mirror the shape of the content being loaded.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-white/10", className)}
      {...props}
    />
  )
}

export { Skeleton }

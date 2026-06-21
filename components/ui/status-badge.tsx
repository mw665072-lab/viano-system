import * as React from "react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  },
  started: {
    label: "Started",
    className: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  },
  downloading: {
    label: "Downloading",
    className: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  },
  generating_messages: {
    label: "Generating Messages",
    className: "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
  },
  storing_messages: {
    label: "Storing Messages",
    className: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  },
  paused: {
    label: "Paused",
    className: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30",
  },
  error: {
    label: "Error",
    className: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30",
  },
  insufficient_credits: {
    label: "Insufficient Credits",
    className: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  },
}

function getStatusConfig(status: string | undefined) {
  if (!status) return STATUS_CONFIG.pending
  const normalized = status.toLowerCase().trim()
  return STATUS_CONFIG[normalized] || { label: normalized, className: "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10" }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = getStatusConfig(status)

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium border whitespace-nowrap",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

export { getStatusConfig }

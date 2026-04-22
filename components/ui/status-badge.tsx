import * as React from "react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  started: {
    label: "Started",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  downloading: {
    label: "Downloading",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  generating_messages: {
    label: "Generating Messages",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  storing_messages: {
    label: "Storing Messages",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  paused: {
    label: "Paused",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  error: {
    label: "Error",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  insufficient_credits: {
    label: "Insufficient Credits",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
}

function getStatusConfig(status: string | undefined) {
  if (!status) return STATUS_CONFIG.pending
  const normalized = status.toLowerCase().trim()
  return STATUS_CONFIG[normalized] || { label: normalized, className: "bg-gray-100 text-gray-700 border-gray-200" }
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

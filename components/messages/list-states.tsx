import React from "react"
import { AlertTriangle } from "lucide-react"

/** Red error box with an optional Retry, matching the existing list pages. */
export function ErrorBox({
  message,
  onRetry,
  children,
}: {
  message: string
  onRetry?: () => void
  children?: React.ReactNode
}) {
  return (
    <div
      role="alert"
      className="flex items-start sm:items-center gap-3 py-4 px-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/30"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        {children}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex-shrink-0 min-h-10 px-2 text-sm text-orange-500 hover:text-orange-600 font-medium"
        >
          Retry
        </button>
      )}
    </div>
  )
}

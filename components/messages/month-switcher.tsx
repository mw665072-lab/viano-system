import React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMonth, isValidMonth, shiftMonth } from "@/lib/outreach-dates"

const ARROW =
  "w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"

/**
 * ‹ December 2026 ›. Each arrow links to `/messages?month=…` (replacing the history entry, so
 * the back button leaves Messages instead of stepping through months). `month: null` shows a
 * placeholder while the server's current month is unknown.
 */
export function MonthSwitcher({ month }: { month: string | null }) {
  if (!isValidMonth(month)) {
    return (
      <div className="flex items-center gap-2" aria-hidden="true">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
    )
  }

  const prev = shiftMonth(month, -1)
  const next = shiftMonth(month, 1)

  return (
    <nav className="flex items-center gap-2" aria-label="Choose month" style={{ fontFamily: "Manrope, sans-serif" }}>
      <Link
        href={`/messages?month=${prev}`}
        replace
        scroll={false}
        className={ARROW}
        aria-label={`Previous month, ${formatMonth(prev)}`}
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>
      <span className="min-w-[9.5rem] text-center text-base font-bold text-[#0C1D38] dark:text-white" aria-live="polite">
        {formatMonth(month)}
      </span>
      <Link
        href={`/messages?month=${next}`}
        replace
        scroll={false}
        className={ARROW}
        aria-label={`Next month, ${formatMonth(next)}`}
      >
        <ChevronRight className="w-5 h-5" />
      </Link>
    </nav>
  )
}

export default MonthSwitcher

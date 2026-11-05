import React from "react"
import { CheckCircle2 } from "lucide-react"

const BASE = "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md border whitespace-nowrap"

/** "Overdue", or "3 overdue" when given a count. Pending from an earlier month. */
export function OverdueBadge({ count }: { count?: number }) {
  return (
    <span className={`${BASE} bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30`}>
      {count != null ? `${count} overdue` : "Overdue"}
    </span>
  )
}

/** "New", or "2 new" when given a count. Added after this month's text was sent. */
export function NewBadge({ count }: { count?: number }) {
  return (
    <span className={`${BASE} bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30`}>
      {count != null ? `${count} new` : "New"}
    </span>
  )
}

/** Overdue and New flags for one update. Renders nothing when neither applies. */
export function StatusBadges({ overdue, isNew }: { overdue?: boolean; isNew?: boolean }) {
  if (!overdue && !isNew) return null
  return (
    <>
      {overdue && <OverdueBadge />}
      {isNew && <NewBadge />}
    </>
  )
}

/** Overdue and New counts for a property or month. Renders nothing when both are 0. */
export function StatusCountBadges({ overdue, isNew }: { overdue: number; isNew: number }) {
  if (overdue <= 0 && isNew <= 0) return null
  return (
    <>
      {overdue > 0 && <OverdueBadge count={overdue} />}
      {isNew > 0 && <NewBadge count={isNew} />}
    </>
  )
}

/** "Contacted on Dec 15". */
export function ContactedChip({ label }: { label: string }) {
  return (
    <span className={`${BASE} bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30`}>
      <CheckCircle2 className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
      {label}
    </span>
  )
}

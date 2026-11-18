import React from "react"
import { CheckCircle2, FileSearch, PauseCircle, ShieldAlert } from "lucide-react"
import type { OutreachVerification } from "@/lib/api"

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

const VERIFICATION_CHIPS: Record<string, { text: string; icon: typeof CheckCircle2; className: string }> = {
  verified: {
    text: "Permit-checked",
    icon: CheckCircle2,
    className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
  },
  not_yet_verified: {
    text: "Permits not checked yet",
    icon: FileSearch,
    className: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10",
  },
  unverified: {
    text: "Permit check unavailable",
    icon: ShieldAlert,
    className: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  },
  on_hold: {
    text: "On hold",
    icon: PauseCircle,
    className: "bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30",
  },
}

/**
 * The permit check of an update that states a system age. The full label is the tooltip.
 * Renders nothing for updates without one, and for "based on the inspection" (the usual case).
 */
export function VerificationChip({ verification }: { verification?: OutreachVerification | null }) {
  const chip = verification ? VERIFICATION_CHIPS[verification.basis] : undefined
  if (!verification || !chip) return null
  const Icon = chip.icon
  return (
    <span className={`${BASE} ${chip.className}`} title={verification.label}>
      <Icon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
      {chip.text}
    </span>
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

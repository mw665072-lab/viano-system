"use client"

import React, { useCallback, useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowRight, Loader2, X } from "lucide-react"
import { billingAPI, getFriendlyErrorMessage } from "@/lib/api"
import { DRAFTS_LIST_HREF, type LimitAction } from "@/lib/property-quota"
import { UpgradeModal } from "@/components/billing/upgrade-modal"

const TITLES: Record<LimitAction, string> = {
  subscribe: "Free limit reached",
  upgrade: "Plan limit reached",
  update_payment: "Payment required",
  review_drafts: "Finish your drafts first",
}

const BUTTON_LABELS: Record<LimitAction, string> = {
  subscribe: "Subscribe",
  upgrade: "Upgrade plan",
  update_payment: "Update payment method",
  review_drafts: "Review drafts",
}

interface PlanLimitNoticeProps {
  action: LimitAction
  /** Main text. Usually the backend's message, or the drafts copy. */
  message: string
  /** Optional second line, e.g. "Your edits are saved to this draft." */
  note?: string
  /** Called after an in-app plan change succeeds (e.g. to refetch the quota or clear the notice). */
  onPlanChanged?: () => void
  onDismiss?: () => void
  className?: string
}

/**
 * The one place that maps a limit case to its button:
 * Subscribe → plan picker/checkout, Upgrade plan → plan picker, Update payment method → Stripe
 * portal, Review drafts → drafts list.
 */
export function PlanLimitNotice({
  action,
  message,
  note,
  onPlanChanged,
  onDismiss,
  className = "",
}: PlanLimitNoticeProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  const openPortal = useCallback(async () => {
    setOpeningPortal(true)
    setPortalError(null)
    try {
      const { portal_url } = await billingAPI.getPortalLink()
      window.location.href = portal_url
    } catch (err) {
      setPortalError(getFriendlyErrorMessage(err, "We couldn't open billing. Please try again."))
      setOpeningPortal(false)
    }
  }, [])

  const buttonClass =
    "inline-flex items-center justify-center gap-1.5 rounded-full bg-[#E8730A] px-4 h-9 text-xs font-semibold text-white hover:bg-[#d1670a] transition-colors disabled:opacity-60 whitespace-nowrap"

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">{TITLES[action]}</p>
          <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300/90">{message}</p>
          {note && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400/80">{note}</p>}
          {portalError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{portalError}</p>}

          <div className="mt-3">
            {action === "review_drafts" ? (
              <Link href={DRAFTS_LIST_HREF} className={buttonClass}>
                {BUTTON_LABELS[action]}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : action === "update_payment" ? (
              <button type="button" onClick={openPortal} disabled={openingPortal} className={buttonClass}>
                {openingPortal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : BUTTON_LABELS[action]}
              </button>
            ) : (
              <button type="button" onClick={() => setUpgradeOpen(true)} className={buttonClass}>
                {BUTTON_LABELS[action]}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {(action === "subscribe" || action === "upgrade") && (
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onChanged={onPlanChanged} />
      )}
    </div>
  )
}

export default PlanLimitNotice

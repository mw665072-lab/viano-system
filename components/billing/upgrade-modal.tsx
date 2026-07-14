"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, Check, Loader2, Star, Zap, Crown, Users, ArrowRight, AlertTriangle, ChevronLeft } from "lucide-react"
import {
  billingAPI,
  getFriendlyErrorMessage,
  ApiError,
  type PlanInfo,
  type PlanSlug,
  type BillingStatusResponse,
  type PlanChangePreviewResponse,
  type DowngradeBlocked,
} from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

const FONT = { fontFamily: "Manrope, sans-serif" }

const CUSTOM_CONTACT_HREF = "mailto:sales@viano.io?subject=Custom%20plan%20inquiry"

const PLAN_ICONS: Record<PlanSlug, React.ComponentType<{ size?: number; className?: string }>> = {
  core: Star,
  pro: Zap,
  elite: Crown,
}

function formatCents(amount: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  onChanged?: () => void
}

export function UpgradeModal({ open, onClose, onChanged }: UpgradeModalProps) {
  const [plans, setPlans] = useState<PlanInfo[] | null>(null)
  const [status, setStatus] = useState<BillingStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actingPlan, setActingPlan] = useState<PlanSlug | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmPreview, setConfirmPreview] = useState<PlanChangePreviewResponse | null>(null)
  const [confirming, setConfirming] = useState(false)
  // Set when a downgrade is blocked (409) because the user holds more properties
  // than the target plan allows. Carries the target plan name for display.
  const [downgradeBlock, setDowngradeBlock] = useState<(DowngradeBlocked & { planName: string }) | null>(null)

  const openRef = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    setActionError(null)
    setConfirmPreview(null)
    setConfirming(false)
    setActingPlan(null)
    setDowngradeBlock(null)
    try {
      const [plansRes, statusRes] = await Promise.all([
        billingAPI.getPlans(),
        billingAPI.getStatus().catch(() => null),
      ])
      if (!openRef.current) return
      setPlans(plansRes.plans)
      setStatus(statusRes)
    } catch (err) {
      if (!openRef.current) return
      setLoadError(getFriendlyErrorMessage(err, "We couldn't load the plans. Please try again."))
    } finally {
      if (openRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    openRef.current = open
    if (open) load()
  }, [open, load])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (downgradeBlock) {
          setDowngradeBlock(null)
        } else if (confirmPreview && !confirming) {
          setConfirmPreview(null)
          setActionError(null)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener("keydown", onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose, confirmPreview, confirming, downgradeBlock])

  const currentPlan = status?.plan ?? "free"
  const hasSubscription = !!status?.has_subscription

  const handleSelect = useCallback(
    async (slug: PlanSlug) => {
      if (slug === currentPlan) return
      const planName = plans?.find((p) => p.slug === slug)?.name ?? slug
      setActingPlan(slug)
      setActionError(null)
      setDowngradeBlock(null)
      try {
        if (hasSubscription) {
          const preview = await billingAPI.previewPlanChange(slug)
          if (!openRef.current) return
          setConfirmPreview(preview)
          setActingPlan(null)
        } else {
          const { checkout_url } = await billingAPI.createCheckoutSession(slug)
          window.location.href = checkout_url
        }
      } catch (err) {
        if (!openRef.current) return
        if (err instanceof ApiError && err.status === 409) {
          setDowngradeBlock({ ...(err.detail as DowngradeBlocked), planName })
        } else {
          setActionError(getFriendlyErrorMessage(err, "We couldn't load the plan change preview. Please try again."))
        }
        setActingPlan(null)
      }
    },
    [currentPlan, hasSubscription, plans]
  )

  const handleConfirmChange = useCallback(async () => {
    if (!confirmPreview) return
    setConfirming(true)
    setActionError(null)
    try {
      await billingAPI.changePlan(confirmPreview.plan, confirmPreview.proration_date)
      onChanged?.()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConfirmPreview(null)
        setDowngradeBlock({ ...(err.detail as DowngradeBlocked), planName: confirmPreview.plan_name })
      } else {
        setActionError(getFriendlyErrorMessage(err, "We couldn't update your plan. Please try again."))
      }
      setConfirming(false)
    }
  }, [confirmPreview, onChanged, onClose])

  if (!open || typeof document === "undefined") return null

  const dueLabel =
    confirmPreview && confirmPreview.amount_due > 0
      ? "Due today"
      : confirmPreview && confirmPreview.amount_due < 0
        ? "Account credit"
        : "Due today"

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={confirming ? undefined : onClose}
      />

      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-[#161616] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
        style={FONT}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-white/10">
          {(confirmPreview || downgradeBlock) && (
            <button
              type="button"
              onClick={() => {
                if (confirming) return
                setConfirmPreview(null)
                setDowngradeBlock(null)
                setActionError(null)
              }}
              disabled={confirming}
              aria-label="Back to plans"
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-[#0C1D38] dark:text-white leading-tight">
              {downgradeBlock
                ? "Too many properties"
                : confirmPreview
                  ? "Confirm plan change"
                  : "Choose your plan"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {downgradeBlock
                ? `Switch to ${downgradeBlock.planName}`
                : confirmPreview
                  ? `${confirmPreview.current_plan_name} → ${confirmPreview.plan_name}`
                  : "Pick the plan that fits your portfolio. Change anytime."}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={confirming}
            aria-label="Close"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-3">
          {actionError && (
            <div className="flex items-start gap-2.5 py-3 px-3.5 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-red-600 dark:text-red-400">{actionError}</p>
            </div>
          )}

          {/* Downgrade blocked: too many properties for the target plan */}
          {downgradeBlock && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    Delete {downgradeBlock.properties_to_delete} propert
                    {downgradeBlock.properties_to_delete === 1 ? "y" : "ies"} to switch
                  </p>
                  <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                    The {downgradeBlock.planName} allows up to{" "}
                    <span className="font-semibold">{downgradeBlock.target_property_limit}</span>{" "}
                    properties, but you currently have{" "}
                    <span className="font-semibold">{downgradeBlock.current_property_count}</span>.
                    Remove {downgradeBlock.properties_to_delete} to continue.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDowngradeBlock(null)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-white/15 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Back to plans
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/manage-properties"
                  }}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-[#E8730A] text-white hover:bg-[#d1670a] transition-colors flex items-center justify-center gap-1.5"
                >
                  Manage properties
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Confirm step */}
          {!downgradeBlock && confirmPreview && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Today&apos;s proration
                  </p>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-white/10">
                  {confirmPreview.lines.map((line, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 px-4 py-3">
                      <span className="text-xs text-gray-600 dark:text-gray-300 leading-snug flex-1">
                        {line.description}
                      </span>
                      <span
                        className={`text-xs font-semibold tabular-nums flex-shrink-0 ${
                          line.amount < 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-[#0C1D38] dark:text-white"
                        }`}
                      >
                        {formatCents(line.amount, line.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10">
                  <span className="text-sm font-bold text-[#0C1D38] dark:text-white">{dueLabel}</span>
                  <span
                    className={`text-base font-bold tabular-nums ${
                      confirmPreview.amount_due <= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-[#0C1D38] dark:text-white"
                    }`}
                  >
                    {confirmPreview.amount_due <= 0
                      ? formatCents(Math.abs(confirmPreview.amount_due), confirmPreview.currency)
                      : formatCents(confirmPreview.amount_due, confirmPreview.currency)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                {confirmPreview.amount_due > 0
                  ? "Your saved payment method will be charged immediately when you confirm."
                  : confirmPreview.amount_due < 0
                    ? "The credit will be applied to your account. No charge today."
                    : "No charge today. Your plan updates immediately."}
                {confirmPreview.next_renewal_amount != null && confirmPreview.next_billing_date && (
                  <>
                    {" "}
                    Your next renewal of{" "}
                    {formatCents(confirmPreview.next_renewal_amount, confirmPreview.currency)} is on{" "}
                    {new Date(confirmPreview.next_billing_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    .
                  </>
                )}
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmPreview(null)
                    setActionError(null)
                  }}
                  disabled={confirming}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-white/15 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmChange}
                  disabled={confirming}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-[#E8730A] text-white hover:bg-[#d1670a] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Confirming…
                    </>
                  ) : confirmPreview.amount_due > 0 ? (
                    "Confirm & pay"
                  ) : (
                    "Confirm change"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Plan list */}
          {!downgradeBlock && !confirmPreview && loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {!downgradeBlock && !confirmPreview && loadError && !loading && (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
              <button
                onClick={load}
                className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {!downgradeBlock && !confirmPreview && !loading && !loadError && plans && (
            <>
              {plans.map((plan) => {
                const Icon = PLAN_ICONS[plan.slug] ?? Star
                const isCurrent = plan.slug === currentPlan
                const isActing = actingPlan === plan.slug
                return (
                  <div
                    key={plan.slug}
                    className={`rounded-2xl border p-4 transition-colors ${
                      isCurrent
                        ? "border-[#E8730A]/40 bg-[#E8730A]/5"
                        : "border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-[#E8730A]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#0C1D38] dark:text-white">{plan.name}</p>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#E8730A]">
                              <Check className="w-3 h-3" /> Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Up to {plan.property_limit} properties
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-bold text-[#0C1D38] dark:text-white">
                          ${plan.monthly_price}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">/month</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelect(plan.slug)}
                      disabled={isCurrent || actingPlan !== null}
                      className={`mt-3 w-full py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:cursor-not-allowed ${
                        isCurrent
                          ? "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500"
                          : "bg-[#E8730A] text-white hover:bg-[#d1670a] disabled:opacity-60"
                      }`}
                    >
                      {isActing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Loading preview…
                        </>
                      ) : isCurrent ? (
                        "Current plan"
                      ) : (
                        <>
                          {hasSubscription ? "Switch to" : "Select"} {plan.name.replace(" Plan", "")}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )
              })}

              <a
                href={CUSTOM_CONTACT_HREF}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-4 hover:border-gray-200 dark:hover:border-white/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-[#E8730A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0C1D38] dark:text-white">Need more than 50?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Custom plans for large teams and brokerages.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E8730A] flex-shrink-0">
                  Contact
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </a>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default UpgradeModal

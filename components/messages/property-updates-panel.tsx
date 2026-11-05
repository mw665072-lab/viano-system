"use client"

import React from "react"
import { ArrowLeft, CalendarCheck, ChevronRight, SearchX } from "lucide-react"
import {
  ApiError,
  getFriendlyErrorMessage,
  type OutreachListItem,
  type OutreachPropertyMonthResponse,
} from "@/lib/api"
import { formatDay, formatMonth, monthName } from "@/lib/outreach-dates"
import { Skeleton } from "@/components/ui/skeleton"
import { KindBadge } from "./kind-badge"
import { StatusBadges, StatusCountBadges } from "./status-badges"
import { ErrorBox } from "./list-states"
import { InitialsAvatar, PanelEmpty } from "./panel-parts"

interface PropertyUpdatesPanelProps {
  month: string | null
  data: OutreachPropertyMonthResponse | null
  isLoading: boolean
  error: unknown
  onRetry: () => void
  onClose: () => void
  onOpenItem: (itemId: string) => void
  /** The card currently open, highlighted in the list. */
  activeItemId: string | null
  /** Address/homeowner from the list row, so the header shows while the updates load. */
  fallback?: { address: string; homeowner: string } | null
}

/**
 * One property's updates for the month, laid out like the Manage Properties detail panel: back
 * arrow, initials avatar, homeowner and address, then a divided section listing the updates.
 * Tapping an update opens its card.
 */
export function PropertyUpdatesPanel({
  month,
  data,
  isLoading,
  error,
  onRetry,
  onClose,
  onOpenItem,
  activeItemId,
  fallback,
}: PropertyUpdatesPanelProps) {
  const notFound = error instanceof ApiError && error.status === 404
  const homeowner = data?.homeowner ?? fallback?.homeowner ?? ""
  const address = data?.address ?? fallback?.address ?? ""
  const shownMonth = data?.month ?? month

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back to properties"
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {homeowner || address ? (
              <>
                <InitialsAvatar name={homeowner} size="lg" />
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{homeowner || "No homeowner"}</h2>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 truncate">{address}</p>
                </div>
              </>
            ) : (
              <>
                <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex-shrink-0" />
                <div className="space-y-2 min-w-0">
                  <Skeleton className="h-6 w-40 max-w-full" />
                  <Skeleton className="h-4 w-52 max-w-full" />
                </div>
              </>
            )}
          </div>

          {!notFound && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {shownMonth && (
                <span className="rounded-full bg-[#E8730A]/15 border border-[#E8730A]/30 text-[#895000] dark:text-orange-300 text-xs font-semibold px-3 py-1">
                  {formatMonth(shownMonth)}
                </span>
              )}
              {data ? (
                <>
                  <span className="rounded-full border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 text-xs font-semibold px-3 py-1">
                    {data.pending_count} pending
                  </span>
                  <StatusCountBadges overdue={data.overdue_count} isNew={data.new_count} />
                </>
              ) : (
                isLoading && <Skeleton className="h-6 w-24 rounded-full" />
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-white/10" />

        {/* Updates */}
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          {notFound ? (
            <PanelEmpty icon={SearchX} title="This property isn't available." body="It may have been transferred." />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Updates this month
                </h3>
                {data && (
                  <span className="rounded-lg border border-gray-100 dark:border-white/10 text-xs sm:text-sm text-gray-600 dark:text-gray-300 px-3 py-1.5">
                    {data.items.length} {data.items.length === 1 ? "Update" : "Updates"}
                  </span>
                )}
              </div>

              {isLoading && (
                <div className="space-y-3" aria-busy="true" aria-label="Loading updates">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-3.5 rounded-2xl border border-gray-100 dark:border-white/10">
                      <Skeleton className="w-12 h-14 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && !!error && !data && (
                <ErrorBox message={getFriendlyErrorMessage(error, "We couldn't load this property's updates. Please try again.")} onRetry={onRetry} />
              )}

              {!isLoading && data && data.items.length === 0 && (
                <PanelEmpty
                  icon={CalendarCheck}
                  title={`No updates in ${monthName(data.month)}.`}
                  body="Nothing is due for this homeowner this month."
                />
              )}

              {!isLoading && data && data.items.length > 0 && (
                <ul className="space-y-3">
                  {data.items.map((item) => (
                    <li key={item.item_id}>
                      <UpdateRow item={item} active={activeItemId === item.item_id} onOpen={onOpenItem} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function UpdateRow({ item, active, onOpen }: { item: OutreachListItem; active: boolean; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.item_id)}
      className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border transition-colors ${
        active
          ? "border-[#E8730A]/40 bg-orange-50/50 dark:bg-[#E8730A]/10"
          : "border-gray-100 dark:border-white/10 bg-white dark:bg-transparent hover:bg-gray-50/60 dark:hover:bg-white/5"
      }`}
    >
      {/* Date tile */}
      <div className="w-12 flex-shrink-0 rounded-xl border border-gray-100 dark:border-white/10 bg-[#FCFCFC] dark:bg-white/5 py-1.5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#E8730A]">
          {formatDay(item.outreach_on, { month: "short" })}
        </p>
        <p className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
          {formatDay(item.outreach_on, { day: "numeric" })}
        </p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <KindBadge kind={item.kind} />
          <StatusBadges overdue={item.overdue} isNew={item.new} />
        </div>
        <p className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-white break-words">{item.title}</p>
        {item.reason && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.reason}</p>}
      </div>

      <ChevronRight className="w-5 h-5 flex-shrink-0 mt-3 text-gray-400" />
    </button>
  )
}

export default PropertyUpdatesPanel

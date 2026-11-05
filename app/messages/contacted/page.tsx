"use client"

import React, { Suspense, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Eye, History, SearchX } from "lucide-react"
import { getFriendlyErrorMessage, outreachAPI, type OutreachContactedItem, type OutreachContactedResponse } from "@/lib/api"
import { formatDay } from "@/lib/outreach-dates"
import { useKeyedRequest } from "@/lib/use-keyed-request"
import { Skeleton } from "@/components/ui/skeleton"
import { KindBadge } from "@/components/messages/kind-badge"
import { ErrorBox } from "@/components/messages/list-states"
import { MessageCard } from "@/components/messages/message-card"
import { useItemParam } from "@/components/messages/use-item-param"
import {
  InitialsAvatar,
  PanelEmpty,
  PanelPagination,
  PanelSearch,
  pageCount,
  pageSlice,
} from "@/components/messages/panel-parts"

const LIMIT = 50

/**
 * Recently contacted, newest first, across months, laid out like the Manage Properties list.
 * Reopening a card from here is how a Realtor shares contractor recommendations days later.
 */
function RecentlyContacted() {
  const { itemId, openItem, closeItem } = useItemParam()
  const fetcher = useCallback(() => outreachAPI.getContacted(LIMIT), [])
  const { data, error, isLoading, retry, refresh } = useKeyedRequest<OutreachContactedResponse>("contacted", fetcher)

  const [search, setSearch] = useState("")
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const items = data?.items ?? []
    if (!q) return items
    return items.filter(
      (i) =>
        i.homeowner.toLowerCase().includes(q) || i.address.toLowerCase().includes(q) || i.title.toLowerCase().includes(q),
    )
  }, [data, search])

  const [pageState, setPageState] = useState({ key: search, page: 1 })
  const totalPages = pageCount(filtered.length)
  const currentPage = pageState.key === search ? Math.min(pageState.page, totalPages) : 1
  const rows = pageSlice(filtered, currentPage)

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] dark:bg-[#0f0f0f]">
      <div className="flex flex-1 overflow-hidden p-4">
        <div className="flex flex-col w-full bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden h-full">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 flex-shrink-0 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <History className="w-5 h-5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">Recently contacted</h1>
                {data && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                    {data.count}
                  </span>
                )}
              </div>
              <Link
                href="/messages"
                aria-label="Back to Messages"
                className="inline-flex items-center justify-center gap-1.5 h-10 w-10 sm:w-auto sm:px-3 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Messages</span>
              </Link>
            </div>
            <PanelSearch value={search} onChange={setSearch} placeholder="Search clients or updates" />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {!isLoading && rows.length > 0 && (
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/5 sticky top-0 z-10">
                <div className="w-10 flex-shrink-0" />
                <div className="flex-1 min-w-0 grid grid-cols-4 gap-4">
                  {["Homeowner", "Update", "Contacted", "Originally"].map((label) => (
                    <span key={label} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="w-[128px] flex-shrink-0" />
              </div>
            )}

            {isLoading && (
              <div aria-busy="true" aria-label="Loading">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`px-4 py-3 flex items-center gap-3 ${i !== 4 ? "border-b border-gray-100 dark:border-white/10" : ""}`}>
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-32 max-w-full" />
                      <Skeleton className="h-3 w-48 max-w-full" />
                    </div>
                    <Skeleton className="h-8 w-[100px] rounded-lg flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !!error && !data && (
              <div className="p-4">
                <ErrorBox message={getFriendlyErrorMessage(error, "We couldn't load your recent contacts. Please try again.")} onRetry={retry} />
              </div>
            )}

            {!isLoading && data && data.items.length === 0 && (
              <PanelEmpty icon={History} title="Nothing marked contacted yet." body="Updates you mark contacted show up here." />
            )}

            {!isLoading && data && data.items.length > 0 && filtered.length === 0 && (
              <PanelEmpty icon={SearchX} title="No matches" body="Try a different search." />
            )}

            {!isLoading &&
              rows.map((item, index) => (
                <ContactedRow
                  key={item.item_id ?? `removed-${item.property_id}-${item.recorded_at}-${index}`}
                  item={item}
                  active={!!item.item_id && item.item_id === itemId}
                  last={index === rows.length - 1}
                  onOpen={openItem}
                />
              ))}
          </div>

          <PanelPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setPageState({ key: search, page })}
          />
        </div>
      </div>

      <MessageCard itemId={itemId} onClose={closeItem} onChanged={refresh} />
    </div>
  )
}

function ContactedRow({
  item,
  active,
  last,
  onOpen,
}: {
  item: OutreachContactedItem
  active: boolean
  last: boolean
  onOpen: (id: string) => void
}) {
  const removed = item.item_id === null
  const contacted = `Contacted ${formatDay(item.contacted_on, { month: "short", day: "numeric" })}`
  const originally = item.outreach_on ? formatDay(item.outreach_on) : "—"
  const open = () => {
    if (item.item_id) onOpen(item.item_id)
  }

  return (
    <div
      onClick={removed ? undefined : open}
      aria-disabled={removed || undefined}
      className={`px-4 py-3 flex items-center gap-3 transition-all duration-150 ${
        removed
          ? "opacity-60"
          : active
            ? "cursor-pointer bg-orange-50/50 dark:bg-[#E8730A]/10"
            : "cursor-pointer bg-white dark:bg-transparent hover:bg-gray-50/50 dark:hover:bg-white/5"
      } ${!last ? "border-b border-gray-100 dark:border-white/10" : ""}`}
    >
      <InitialsAvatar name={item.homeowner} selected={active} />

      {/* Columns (desktop) */}
      <div className="hidden lg:grid flex-1 min-w-0 grid-cols-4 gap-4 items-center">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.homeowner || "No homeowner"}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.address}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{item.title}</p>
          <div className="mt-1">
            <KindBadge kind={item.kind} />
          </div>
        </div>
        <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          {contacted}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {removed ? <span className="italic">No longer in the schedule</span> : originally}
        </p>
      </div>

      {/* Stacked (mobile) */}
      <div className="flex-1 min-w-0 lg:hidden">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.homeowner || "No homeowner"}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.address}</p>
        <p className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-200 break-words">{item.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <KindBadge kind={item.kind} />
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            {contacted}
          </span>
        </div>
        {removed && <p className="mt-0.5 text-[11px] italic text-gray-400">No longer in the schedule</p>}
      </div>

      <div className="flex-shrink-0 w-auto lg:w-[128px] flex justify-end">
        {!removed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              open()
            }}
            className="inline-flex items-center gap-1.5 h-10 lg:h-8 px-3 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-medium whitespace-nowrap text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Open
          </button>
        )}
      </div>
    </div>
  )
}

export default function RecentlyContactedPage() {
  return (
    <Suspense fallback={<div className="h-full bg-[#F8F9FB] dark:bg-[#0f0f0f]" />}>
      <RecentlyContacted />
    </Suspense>
  )
}

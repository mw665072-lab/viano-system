"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { CalendarCheck, ChevronDown, Eye, EyeOff, History, MessageSquare, SearchX } from "lucide-react"
import { ApiError, getFriendlyErrorMessage, type OutreachMonthResponse, type OutreachPropertyRow } from "@/lib/api"
import { formatDay, monthName } from "@/lib/outreach-dates"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MonthSwitcher } from "./month-switcher"
import { NewBadge, OverdueBadge, StatusCountBadges } from "./status-badges"
import { ErrorBox } from "./list-states"
import {
  InitialsAvatar,
  PanelEmpty,
  PanelPagination,
  PanelSearch,
  ViewToggleButton,
  pageCount,
  pageSlice,
} from "./panel-parts"

const FILTERS = ["All Status", "Overdue", "New"] as const
type Filter = (typeof FILTERS)[number]

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

interface PropertyQueueListProps {
  /** The month shown (null while the server's current month is still unknown). */
  month: string | null
  data: OutreachMonthResponse | null
  isLoading: boolean
  error: unknown
  onRetry: () => void
  selectedPropertyId: string | null
  onSelect: (propertyId: string) => void
  onCloseDetails: () => void
  /** Full width (no detail panel open): rows render as columns on desktop. */
  expanded: boolean
}

/**
 * The month's properties, laid out like the Manage Properties client list: header with search and
 * a filter, initials avatars, a View/Hide toggle per row, and pagination in the footer.
 */
export function PropertyQueueList({
  month,
  data,
  isLoading,
  error,
  onRetry,
  selectedPropertyId,
  onSelect,
  onCloseDetails,
  expanded,
}: PropertyQueueListProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("All Status")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.properties ?? []).filter((p) => {
      if (filter === "Overdue" && p.overdue_count <= 0) return false
      if (filter === "New" && p.new_count <= 0) return false
      if (!q) return true
      return p.address.toLowerCase().includes(q) || p.homeowner.toLowerCase().includes(q)
    })
  }, [data, search, filter])

  // Back to page 1 whenever the month, search or filter changes (derived, no effect needed).
  const pageKey = `${data?.month ?? ""}|${search}|${filter}`
  const [pageState, setPageState] = useState({ key: pageKey, page: 1 })
  const totalPages = pageCount(filtered.length)
  const currentPage = pageState.key === pageKey ? Math.min(pageState.page, totalPages) : 1
  const rows = pageSlice(filtered, currentPage)

  const badMonth = error instanceof ApiError && error.status === 422
  const showError = !isLoading && !!error && !data
  const hasAny = (data?.properties.length ?? 0) > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header: title, month, summary, search + filter */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="w-5 h-5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Messages</h2>
          </div>
          <Link
            href="/messages/contacted"
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex-shrink-0"
          >
            <History className="w-4 h-4 text-[#E8730A]" />
            <span className="hidden sm:inline">Recently contacted</span>
            <span className="sm:hidden">Contacted</span>
          </Link>
        </div>

        {!badMonth && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-3">
            <MonthSwitcher month={month} />
            {isLoading ? (
              <Skeleton className="h-4 w-48 rounded" />
            ) : data ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm text-gray-600 dark:text-gray-300 mr-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {plural(data.pending_update_count, "update", "updates")}
                  </span>{" "}
                  across{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {plural(data.property_count, "property", "properties")}
                  </span>
                </p>
                {data.overdue_update_count > 0 && <OverdueBadge count={data.overdue_update_count} />}
                {data.new_update_count > 0 && <NewBadge count={data.new_update_count} />}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex items-center gap-2">
          <PanelSearch value={search} onChange={setSearch} placeholder="Search clients" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 h-10 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex-shrink-0"
              >
                <span className="whitespace-nowrap">{filter}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {FILTERS.map((f) => (
                <DropdownMenuItem key={f} onClick={() => setFilter(f)}>
                  {f}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* List area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {expanded && !isLoading && rows.length > 0 && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/5 sticky top-0 z-10">
            <div className="w-10 flex-shrink-0" />
            <div className="flex-1 min-w-0 grid grid-cols-4 gap-4">
              {["Homeowner", "Address", "Updates", "Next"].map((label) => (
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
                  <Skeleton className="h-3 w-40 max-w-full" />
                </div>
                <Skeleton className="h-8 w-[100px] rounded-lg flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {showError && (
          <div className="p-4">
            {badMonth ? (
              <ErrorBox message="That month isn't valid.">
                <Link href="/messages" className="mt-1 inline-flex items-center min-h-10 text-sm font-semibold text-orange-500 hover:text-orange-600">
                  Go to this month
                </Link>
              </ErrorBox>
            ) : (
              <ErrorBox message={getFriendlyErrorMessage(error, "We couldn't load your messages. Please try again.")} onRetry={onRetry} />
            )}
          </div>
        )}

        {!isLoading && data && !hasAny && (
          <PanelEmpty icon={CalendarCheck} title={`No updates in ${monthName(data.month)}.`} body="Nothing is due this month." />
        )}

        {!isLoading && data && hasAny && filtered.length === 0 && (
          <PanelEmpty icon={SearchX} title="No matching properties" body="Try a different search or filter.">
            <button
              type="button"
              onClick={() => {
                setSearch("")
                setFilter("All Status")
              }}
              className="mt-3 min-h-10 text-sm font-semibold text-orange-500 hover:text-orange-600"
            >
              Clear search and filter
            </button>
          </PanelEmpty>
        )}

        {!isLoading &&
          rows.map((p, index) => (
            <PropertyRow
              key={p.property_id}
              row={p}
              selected={selectedPropertyId === p.property_id}
              last={index === rows.length - 1}
              expanded={expanded}
              onSelect={onSelect}
              onCloseDetails={onCloseDetails}
            />
          ))}
      </div>

      <PanelPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setPageState({ key: pageKey, page })}
      />
    </div>
  )
}

function PropertyRow({
  row: p,
  selected,
  last,
  expanded,
  onSelect,
  onCloseDetails,
}: {
  row: OutreachPropertyRow
  selected: boolean
  last: boolean
  expanded: boolean
  onSelect: (id: string) => void
  onCloseDetails: () => void
}) {
  const next = formatDay(p.next_outreach_on, { month: "short", day: "numeric" })
  const updates = plural(p.pending_count, "update", "updates")

  return (
    <div
      onClick={() => (selected ? onCloseDetails() : onSelect(p.property_id))}
      className={`cursor-pointer transition-all duration-150 px-4 py-3 flex items-center gap-3 ${
        selected ? "bg-orange-50/50 dark:bg-[#E8730A]/10" : "bg-white dark:bg-transparent hover:bg-gray-50/50 dark:hover:bg-white/5"
      } ${!last ? "border-b border-gray-100 dark:border-white/10" : ""}`}
    >
      <InitialsAvatar name={p.homeowner} selected={selected} />

      {/* Columns (full width, desktop) */}
      {expanded && (
        <div className="hidden lg:grid flex-1 min-w-0 grid-cols-4 gap-4 items-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.homeowner || "No homeowner"}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{p.address}</p>
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200 mr-0.5">{updates}</span>
            <StatusCountBadges overdue={p.overdue_count} isNew={p.new_count} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{next}</p>
        </div>
      )}

      {/* Stacked (narrow panel, and mobile) */}
      <div className={`flex-1 min-w-0 ${expanded ? "lg:hidden" : ""}`}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.homeowner || "No homeowner"}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.address}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400 mr-0.5">
            {updates} · Next {next}
          </span>
          <StatusCountBadges overdue={p.overdue_count} isNew={p.new_count} />
        </div>
      </div>

      <div className="flex-shrink-0">
        <ViewToggleButton
          selected={selected}
          noun="Updates"
          ShowIcon={Eye}
          HideIcon={EyeOff}
          onClick={(e) => {
            e.stopPropagation()
            if (selected) onCloseDetails()
            else onSelect(p.property_id)
          }}
        />
      </div>
    </div>
  )
}

export default PropertyQueueList

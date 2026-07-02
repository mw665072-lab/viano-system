"use client"

import React, { useState, useEffect, useCallback } from "react"
import { CalendarDays, AlertTriangle } from "lucide-react"
import { propertyAPI, UpcomingTouchpointItem } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDetailModal } from "@/components/touchpoints/alert-detail-modal"

const ITEMS_PER_PAGE = 15
const DAYS_WINDOW = 180

const PRIORITY_STYLES: Record<number, { bg: string; text: string; border: string; label: string }> = {
  3: { bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/30", label: "Low" },
  2: { bg: "bg-orange-50 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-500/30", label: "Medium" },
  1: { bg: "bg-red-50 dark:bg-red-500/15", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-500/30", label: "High" },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getPriorityStyle(priority: number) {
  return PRIORITY_STYLES[priority] || PRIORITY_STYLES[1]
}

export default function UpcomingTouchpointsPage() {
  const [touchpoints, setTouchpoints] = useState<UpcomingTouchpointItem[]>([])
  const [days, setDays] = useState<number>(DAYS_WINDOW)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await propertyAPI.getUpcomingTouchpoints(DAYS_WINDOW)
      // Soonest first, so the most imminent touchpoints lead the list.
      const sorted = [...result.touchpoints].sort(
        (a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
      )
      setTouchpoints(sorted)
      setDays(result.days || DAYS_WINDOW)
      setError(null)
    } catch (err) {
      console.error("Upcoming touchpoints fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalPages = Math.ceil(touchpoints.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const displayItems = touchpoints.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="w-full">
      {/* Title + count badge + subtitle */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1
            className="text-xl md:text-2xl font-bold text-[#0C1D38] dark:text-white"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Upcoming Touchpoints
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
            {touchpoints.length}
          </span>
        </div>
        <p
          className="text-sm text-gray-500 dark:text-gray-400 mt-1"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Scheduled over the next {days} days
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <>
          {/* Desktop Table Skeleton */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  {[
                    { label: "Property", align: "pl-3" },
                    { label: "Touchpoint", align: "" },
                    { label: "Priority", align: "" },
                    { label: "Viano Year", align: "" },
                    { label: "Scheduled", align: "pr-3" },
                  ].map((col) => (
                    <th
                      key={col.label}
                      className={`text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold pb-3 pt-2 ${col.align}`}
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-white/10 last:border-0">
                    <td className="py-[10px] pl-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-[52px] h-[52px] flex-shrink-0 rounded-xl" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-[140px]" />
                          <Skeleton className="h-3 w-[90px]" />
                        </div>
                      </div>
                    </td>
                    <td className="py-[10px]">
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-[110px]" />
                        <Skeleton className="h-3 w-[70px]" />
                      </div>
                    </td>
                    <td className="py-[10px]">
                      <Skeleton className="h-6 w-[56px] rounded-lg" />
                    </td>
                    <td className="py-[10px]">
                      <Skeleton className="h-6 w-[60px] rounded-lg" />
                    </td>
                    <td className="py-[10px] pr-3">
                      <Skeleton className="h-3.5 w-[90px]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards Skeleton */}
          <div className="md:hidden space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a1a1a]">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-12 h-12 flex-shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-5 w-[48px] rounded-md" />
                  <Skeleton className="h-5 w-[60px] rounded-md" />
                  <Skeleton className="h-3 w-[70px]" />
                </div>
                <div className="mt-2 space-y-1.5">
                  <Skeleton className="h-3.5 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 py-4 px-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/30">
          <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="ml-auto text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && touchpoints.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-2">
            <CalendarDays className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-[#0C1D38] dark:text-white">No upcoming touchpoints</p>
          <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5 max-w-[260px]">
            Nothing is scheduled in the next {days} days. New touchpoints appear here as properties are processed.
          </p>
        </div>
      )}

      {/* Full-width list */}
      {!isLoading && !error && touchpoints.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  {[
                    { label: "Property", align: "pl-3" },
                    { label: "Touchpoint", align: "" },
                    { label: "Priority", align: "" },
                    { label: "Viano Year", align: "" },
                    { label: "Scheduled", align: "pr-3" },
                  ].map((col) => (
                    <th
                      key={col.label}
                      className={`text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold pb-3 pt-2 ${col.align}`}
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayItems.map((tp) => {
                  const priority = getPriorityStyle(tp.priority)
                  return (
                    <tr
                      key={tp.message_id}
                      onClick={() => setSelectedMessageId(tp.message_id)}
                      className="group cursor-pointer border-b border-gray-50 dark:border-white/10 last:border-0 hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-[10px] pl-3">
                        <div className="flex items-center gap-3">
                          <div className="w-[52px] h-[52px] flex-shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#0C1D38] dark:text-white truncate max-w-[200px]" style={{ fontFamily: "Manrope, sans-serif" }}>
                              {tp.property_address}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]" style={{ fontFamily: "Manrope, sans-serif" }}>
                              {tp.client_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-[10px]">
                        <p className="text-sm font-medium text-[#0C1D38] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{tp.alert_type}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>{tp.trigger}</p>
                      </td>
                      <td className="py-[10px]">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${priority.bg} ${priority.text} ${priority.border}`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="py-[10px]">
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                          Year {tp.viano_year}
                        </span>
                      </td>
                      <td className="py-[10px] pr-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300" style={{ fontFamily: "Manrope, sans-serif" }}>{formatDate(tp.scheduled_for)}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {displayItems.map((tp) => {
              const priority = getPriorityStyle(tp.priority)
              return (
                <div key={tp.message_id} onClick={() => setSelectedMessageId(tp.message_id)} className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/10 transition-all bg-white dark:bg-[#1a1a1a] cursor-pointer active:scale-[0.99]">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0C1D38] dark:text-white truncate" style={{ fontFamily: "Manrope, sans-serif" }}>{tp.property_address}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate" style={{ fontFamily: "Manrope, sans-serif" }}>{tp.client_name}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md border ${priority.bg} ${priority.text} ${priority.border}`}>{priority.label}</span>
                    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">Year {tp.viano_year}</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>{formatDate(tp.scheduled_for)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#0C1D38] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{tp.alert_type}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>{tp.trigger}</p>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => goToPage(page)} className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${page === currentPage ? "bg-orange-500 text-white" : "border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"}`}>{page}</button>
              ))}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
            </div>
          )}
        </>
      )}

      <AlertDetailModal
        messageId={selectedMessageId}
        open={selectedMessageId !== null}
        onClose={() => setSelectedMessageId(null)}
      />
    </div>
  )
}

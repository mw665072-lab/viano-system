"use client"

import React, { useState, useEffect, useCallback } from "react"
import { ThumbsUp, ThumbsDown, Check, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { propertyAPI, ScheduledAlert } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

const ITEMS_PER_PAGE = 15

const PRIORITY_STYLES: Record<number, { bg: string; text: string; border: string; label: string }> = {
  3: { bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/30", label: "Low" },
  2: { bg: "bg-orange-50 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-500/30", label: "Medium" },
  1: { bg: "bg-red-50 dark:bg-red-500/15", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-500/30", label: "High" },
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scheduled_twilio: { bg: "bg-orange-50 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-400", label: "Sent" },
  sent: { bg: "bg-blue-50 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-400", label: "Sent" },
  completed: { bg: "bg-gray-100 dark:bg-white/10", text: "text-gray-600 dark:text-gray-300", label: "Completed" },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getPriorityStyle(priority: number) {
  return PRIORITY_STYLES[priority] || PRIORITY_STYLES[1]
}

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] || STATUS_STYLES.scheduled_twilio
}

export default function RecentAlertsPage() {
  const [alerts, setAlerts] = useState<ScheduledAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, "yes" | "no">>({})
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = useCallback(async () => {
    try {
      const result = await propertyAPI.getScheduledAlerts()
      setAlerts(result)
      setError(null)
    } catch (err) {
      console.error("ScheduledAlerts fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFeedback = (alertId: string, value: "yes" | "no") => {
    setFeedback((prev) => ({ ...prev, [alertId]: value }))
  }

  const totalPages = Math.ceil(alerts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const displayAlerts = alerts.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="w-full">
      {/* Single clean title with count badge */}
      <div className="flex items-center gap-3 mb-6">
        <h1
          className="text-xl md:text-2xl font-bold text-[#0C1D38] dark:text-white"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Property Alerts
        </h1>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
          {alerts.length}
        </span>
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
                    { label: "Alert Type", align: "" },
                    { label: "Priority", align: "" },
                    { label: "Date", align: "" },
                    { label: "Status", align: "" },
                    { label: "Feedback", align: "pr-3" },
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
                      <Skeleton className="h-3.5 w-[80px]" />
                    </td>
                    <td className="py-[10px]">
                      <Skeleton className="h-6 w-[64px] rounded-lg" />
                    </td>
                    <td className="py-[10px] pr-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <Skeleton className="h-3 w-[80px]" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-8 h-8 rounded-lg" />
                          <Skeleton className="w-8 h-8 rounded-lg" />
                        </div>
                      </div>
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
                  <Skeleton className="h-5 w-[56px] rounded-md" />
                  <Skeleton className="h-3 w-[70px]" />
                </div>
                <div className="mt-2 space-y-1.5">
                  <Skeleton className="h-3.5 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-3 w-[80px]" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
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
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-2">
            <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-[#0C1D38] dark:text-white">No scheduled alerts</p>
          <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5 max-w-[220px]">
            All alerts have been sent or resolved.
          </p>
        </div>
      )}

      {/* Full-width table */}
      {!isLoading && !error && alerts.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  {[
                    { label: "Property", align: "pl-3" },
                    { label: "Alert Type", align: "" },
                    { label: "Priority", align: "" },
                    { label: "Date", align: "" },
                    { label: "Status", align: "" },
                    { label: "Feedback", align: "pr-3" },
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
                {displayAlerts.map((alert) => {
                  const priority = getPriorityStyle(alert.priority)
                  const status = getStatusStyle(alert.status)
                  const userFeedback = feedback[alert.message_id]

                  return (
                    <tr
                      key={alert.message_id}
                      className="group border-b border-gray-50 dark:border-white/10 last:border-0 hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-[10px] pl-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-[52px] h-[52px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-200 dark:bg-white/10">
                            <Image src="/property-default-v2.png" alt={alert.property_address} fill className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#0C1D38] dark:text-white truncate max-w-[180px]" style={{ fontFamily: "Manrope, sans-serif" }}>
                              {alert.property_address}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>
                              {alert.client_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-[10px]">
                        <p className="text-sm font-medium text-[#0C1D38] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{alert.alert_type}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>{alert.trigger}</p>
                      </td>
                      <td className="py-[10px]">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${priority.bg} ${priority.text} ${priority.border}`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="py-[10px]">
                        <p className="text-sm text-gray-600 dark:text-gray-300" style={{ fontFamily: "Manrope, sans-serif" }}>{formatDate(alert.scheduled_for)}</p>
                      </td>
                      <td className="py-[10px]">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-[10px] pr-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>
                            Was this helpful?
                          </span>
                          {userFeedback ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <Check className="w-4 h-4" />
                              <span className="text-xs font-medium" style={{ fontFamily: "Manrope, sans-serif" }}>Thanks!</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleFeedback(alert.message_id, "yes")} aria-label="Helpful" className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleFeedback(alert.message_id, "no")} aria-label="Not helpful" className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {displayAlerts.map((alert) => {
              const priority = getPriorityStyle(alert.priority)
              const status = getStatusStyle(alert.status)
              const userFeedback = feedback[alert.message_id]

              return (
                <div key={alert.message_id} className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/10 transition-all bg-white dark:bg-[#1a1a1a]">
                  <div className="flex items-start gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-white/10">
                      <Image src="/property-default-v2.png" alt={alert.property_address} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0C1D38] dark:text-white truncate" style={{ fontFamily: "Manrope, sans-serif" }}>{alert.property_address}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>{alert.client_name}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md border ${priority.bg} ${priority.text} ${priority.border}`}>{priority.label}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md ${status.bg} ${status.text}`}>{status.label}</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>{formatDate(alert.scheduled_for)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#0C1D38] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{alert.alert_type}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>{alert.trigger}</p>
                  {userFeedback ? (
                    <div className="mt-3 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-medium" style={{ fontFamily: "Manrope, sans-serif" }}>Thanks for your feedback!</span>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>Was this helpful?</span>
                      <button onClick={() => handleFeedback(alert.message_id, "yes")} aria-label="Helpful" className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><ThumbsUp className="w-4 h-4" /></button>
                      <button onClick={() => handleFeedback(alert.message_id, "no")} aria-label="Not helpful" className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"><ThumbsDown className="w-4 h-4" /></button>
                    </div>
                  )}
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
    </div>
  )
}

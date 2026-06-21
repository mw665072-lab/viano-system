"use client"

import React, { useState, useEffect, useCallback } from "react"
import { ChevronRight, Bell, ThumbsUp, ThumbsDown, Check, Loader2, AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { propertyAPI, ScheduledAlert } from "@/lib/api"

const PRIORITY_STYLES: Record<number, { text: string; border: string; label: string }> = {
  3: {
    text: "text-green-600 dark:text-green-400",
    border: "border-green-500/50",
    label: "Low",
  },
  2: {
    text: "text-orange-500 dark:text-orange-400",
    border: "border-orange-500/60",
    label: "Medium",
  },
  1: {
    text: "text-red-500 dark:text-red-400",
    border: "border-red-500/60",
    label: "High",
  },
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  scheduled_twilio: {
    bg: "bg-orange-50 dark:bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-300 dark:border-orange-500/40",
    label: "Sent",
  },
  sent: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-500/40",
    label: "Sent",
  },
  completed: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-300 dark:border-emerald-500/40",
    label: "Completed",
  },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getPriorityStyle(priority: number) {
  return PRIORITY_STYLES[priority] || PRIORITY_STYLES[1]
}

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] || STATUS_STYLES.scheduled_twilio
}

export function RecentPropertyAlerts() {
  const [alerts, setAlerts] = useState<ScheduledAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, "yes" | "no">>({})

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

  const displayAlerts = alerts.slice(0, 3)

  const handleFeedback = (alertId: string, value: "yes" | "no") => {
    setFeedback((prev) => ({ ...prev, [alertId]: value }))
  }

  return (
    <div className="bg-white dark:bg-[#1a1a1a] dark:border dark:border-white/10 w-full rounded-[32px] p-4 md:p-6 lg:p-[32px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 md:pb-4 mb-0 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-[#6E6355] flex-shrink-0" />
          <h2
            className="text-sm md:text-base font-bold uppercase tracking-wide text-[#6E6355]"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Recent Property Alerts
          </h2>
        </div>
        <Link
          href="/recent-alerts"
          className="inline-flex items-center gap-2 bg-[#F9F9F7] dark:bg-white/5 border border-[#F3F4F4] dark:border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-[#1F1F1F] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          View All
          <ArrowRight className="w-4 h-4 text-[#1F1F1F] dark:text-gray-200" />
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="w-7 h-7 animate-spin text-orange-400" />
          <p
            className="mt-3 text-sm text-gray-400"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Loading alerts...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 py-4 px-4 bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p
            className="text-sm text-red-600"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <Check className="w-7 h-7 text-emerald-500" />
          </div>
          <p
            className="text-base font-semibold text-[#0C1D38] dark:text-white"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            No scheduled alerts
          </p>
          <p
            className="text-sm text-gray-400 mt-1 max-w-[280px]"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            All alerts have been sent or resolved. New alerts will appear here when scheduled.
          </p>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && !error && alerts.length > 0 && (
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
                    className={`text-left text-[11px] uppercase tracking-wider text-gray-600 dark:text-gray-400 font-bold pb-3 pt-2 ${col.align}`}
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
                    {/* Property */}
                    <td className="py-[10px] pl-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-[52px] h-[52px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-200 dark:bg-white/10">
                          <Image
                            src="/property-default-v2.png"
                            alt={alert.property_address}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-semibold text-[#0C1D38] dark:text-white truncate max-w-[180px]"
                            style={{ fontFamily: "Manrope, sans-serif" }}
                          >
                            {alert.property_address}
                          </p>
                          <p
                            className="text-xs text-gray-500 dark:text-gray-400"
                            style={{ fontFamily: "Manrope, sans-serif" }}
                          >
                            {alert.client_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Alert Type */}
                    <td className="py-[10px]">
                      <p
                        className="text-sm font-medium text-[#0C1D38] dark:text-white"
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {alert.alert_type}
                      </p>
                      <p
                        className="text-xs text-gray-400"
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {alert.trigger}
                      </p>
                    </td>

                    {/* Priority */}
                    <td className="py-[10px]">
                      <span
                        className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${priority.text} ${priority.border}`}
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {priority.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-[10px]">
                      <p
                        className="text-sm text-gray-600 dark:text-gray-300"
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {formatDate(alert.scheduled_for)}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-[10px]">
                      <span
                        className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${status.bg} ${status.text} ${status.border}`}
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* Feedback */}
                    <td className="py-[10px] pr-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className="text-xs text-gray-500 dark:text-gray-400"
                          style={{ fontFamily: "Manrope, sans-serif" }}
                        >
                          Was this helpful?
                        </span>
                        {userFeedback ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <Check className="w-4 h-4" />
                            <span
                              className="text-xs font-medium"
                              style={{ fontFamily: "Manrope, sans-serif" }}
                            >
                              Thanks!
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleFeedback(alert.message_id, "yes")}
                              aria-label="Helpful"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleFeedback(alert.message_id, "no")}
                              aria-label="Not helpful"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            >
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
      )}

      {/* Mobile Cards */}
      {!isLoading && !error && alerts.length > 0 && (
        <div className="md:hidden space-y-3">
          {displayAlerts.map((alert) => {
            const priority = getPriorityStyle(alert.priority)
            const status = getStatusStyle(alert.status)
            const userFeedback = feedback[alert.message_id]

            return (
              <div
                key={alert.message_id}
                className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-gray-200 dark:border-white/10 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-white/10">
                    <Image
                      src="/property-default-v2.png"
                      alt={alert.property_address}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold text-[#0C1D38] dark:text-white truncate"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {alert.property_address}
                    </p>
                    <p
                      className="text-xs text-gray-500 dark:text-gray-400"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {alert.client_name}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${priority.text} ${priority.border}`}
                  >
                    {priority.label}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${status.bg} ${status.text} ${status.border}`}
                  >
                    {status.label}
                  </span>
                  <span
                    className="text-[11px] text-gray-400"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {formatDate(alert.scheduled_for)}
                  </span>
                </div>

                <p
                  className="mt-2 text-sm font-medium text-[#0C1D38] dark:text-white"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {alert.alert_type}
                </p>
                <p
                  className="text-xs text-gray-400"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {alert.trigger}
                </p>

                {userFeedback ? (
                  <div className="mt-3 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-medium" style={{ fontFamily: "Manrope, sans-serif" }}>
                      Thanks for your feedback!
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>
                      Was this helpful?
                    </span>
                    <button
                      onClick={() => handleFeedback(alert.message_id, "yes")}
                      aria-label="Helpful"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(alert.message_id, "no")}
                      aria-label="Not helpful"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RecentPropertyAlerts

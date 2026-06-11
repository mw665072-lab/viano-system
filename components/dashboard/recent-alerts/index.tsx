"use client"

import React, { useState, useEffect, useCallback } from "react"
import { ChevronRight, Bell, ThumbsUp, ThumbsDown, Check, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { propertyAPI, ScheduledAlert } from "@/lib/api"

const PRIORITY_STYLES: Record<number, { bg: string; text: string; border: string; label: string }> = {
  3: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Low",
  },
  2: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    label: "Medium",
  },
  1: {
        bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    label: "High",

  },
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scheduled_twilio: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    label: "Sent",
  },
  sent: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "Sent",
  },
  completed: {
    bg: "bg-gray-100",
    text: "text-gray-600",
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
    <div className="bg-white w-full rounded-[32px] p-4 md:p-6 lg:p-[32px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 md:pb-4 mb-0 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
          </div>
          <h2
            className="text-sm md:text-base font-bold uppercase tracking-wide text-[#0C1D38]"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Recent Property Alerts
          </h2>
        </div>
        <Link
          href="/recent-alerts"
          className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1 whitespace-nowrap group/link"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          View All Alerts
          <ChevronRight className="w-4 h-4 text-orange-500 group-hover/link:text-orange-600 transition-colors" />
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
            className="text-base font-semibold text-[#0C1D38]"
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
              <tr className="border-b border-gray-100">
                {[
                  { label: "Property", align: "pl-3" },
                  { label: "Alert Type", align: "" },
                  { label: "Priority", align: "" },
                  { label: "Date", align: "" },
                  { label: "Status", align: "" },
                  { label: "Was this helpful?", align: "text-center pr-3" },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`text-left text-[11px] uppercase tracking-wider text-gray-600 font-bold pb-3 pt-2 ${col.align}`}
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
                    className="group border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Property */}
                    <td className="py-[10px] pl-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-[52px] h-[52px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
                          <Image
                            src="/property-default.png"
                            alt={alert.property_address}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-semibold text-[#0C1D38] truncate max-w-[180px]"
                            style={{ fontFamily: "Manrope, sans-serif" }}
                          >
                            {alert.property_address}
                          </p>
                          <p
                            className="text-xs text-gray-500"
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
                        className="text-sm font-medium text-[#0C1D38]"
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
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${priority.bg} ${priority.text} ${priority.border}`}
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {priority.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-[10px]">
                      <p
                        className="text-sm text-gray-600"
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {formatDate(alert.scheduled_for)}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-[10px]">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${status.bg} ${status.text}`}
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* Feedback */}
                    <td className="py-[10px] pr-3">
                      <div className="flex items-center justify-center gap-2">
                        {userFeedback ? (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <Check className="w-4 h-4" />
                            <span
                              className="text-xs font-medium"
                              style={{ fontFamily: "Manrope, sans-serif" }}
                            >
                              Thanks!
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleFeedback(alert.message_id, "yes")}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              style={{ fontFamily: "Manrope, sans-serif" }}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              Yes
                            </button>
                            <button
                              onClick={() => handleFeedback(alert.message_id, "no")}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                              style={{ fontFamily: "Manrope, sans-serif" }}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              No
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
                className="p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <Image
                      src="/property-default.png"
                      alt={alert.property_address}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold text-[#0C1D38] truncate"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {alert.property_address}
                    </p>
                    <p
                      className="text-xs text-gray-500"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {alert.client_name}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md border ${priority.bg} ${priority.text} ${priority.border}`}
                  >
                    {priority.label}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md ${status.bg} ${status.text}`}
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
                  className="mt-2 text-sm font-medium text-[#0C1D38]"
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
                  <div className="mt-3 flex items-center gap-1.5 text-emerald-600">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-medium" style={{ fontFamily: "Manrope, sans-serif" }}>
                      Thanks for your feedback!
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>
                      Helpful?
                    </span>
                    <button
                      onClick={() => handleFeedback(alert.message_id, "yes")}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Yes
                    </button>
                    <button
                      onClick={() => handleFeedback(alert.message_id, "no")}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      No
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

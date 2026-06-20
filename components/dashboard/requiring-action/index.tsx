"use client"

import React, { useState, useEffect, useCallback } from "react"
import { X, ChevronRight, AlertTriangle, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { propertyAPI, RequiringActionProperty, FlaggedSystem } from "@/lib/api"

// Determine tag color based on alert_tier and percentage_used
function getTagStyle(alertTier: string, percentageUsed: number) {
  const isTier2 = alertTier === "Tier 2"

  if (isTier2) {
    // Critical — always red
    return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" }
  }

  // Tier 1 — color based on percentage_used
  if (percentageUsed >= 80) {
    return { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" }
  }
  if (percentageUsed >= 60) {
    return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" }
  }
  if (percentageUsed >= 40) {
    return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" }
  }
  return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" }
}

// Human-readable system type label
function getSystemLabel(systemType: string) {
  const labels: Record<string, string> = {
    roof_shingle: "Roof",
    roof_tile: "Roof",
    roof_metal: "Roof",
    water_heater: "Water Heater",
    hvac: "HVAC",
    ac: "A/C",
    electrical: "Electrical",
    plumbing: "Plumbing",
    anniversary: "Anniversary",
    equity: "Equity",
  }
  return (
    labels[systemType] ||
    systemType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

// Flatten all flagged systems across properties into a single sorted list
function flattenFlaggedItems(data: RequiringActionProperty[]) {
  const items: Array<{ property: RequiringActionProperty; system: FlaggedSystem }> = []

  data.forEach((property) => {
    property.flagged_systems.forEach((system) => {
      items.push({ property, system })
    })
  })

  // Sort: Tier 2 first, then highest percentage_used
  items.sort((a, b) => {
    const aTier = a.system.alert_tier === "Tier 2" ? 0 : 1
    const bTier = b.system.alert_tier === "Tier 2" ? 0 : 1
    if (aTier !== bTier) return aTier - bTier
    return b.system.percentage_used - a.system.percentage_used
  })

  return items
}

export function RequiringActionPanel() {
  const [data, setData] = useState<RequiringActionProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissingId, setDismissingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const result = await propertyAPI.getRequiringAction()
      setData(result)
      setError(null)
    } catch (err) {
      console.error("RequiringAction fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDismiss = useCallback(async (systemId: string) => {
    setDismissingId(systemId)
    try {
      await propertyAPI.dismissSystem(systemId)
      // Remove the dismissed system from local state
      setData((prev) =>
        prev
          .map((property) => ({
            ...property,
            flagged_systems: property.flagged_systems.filter(
              (s) => s.system_id !== systemId
            ),
          }))
          .filter((property) => property.flagged_systems.length > 0)
      )
    } catch (err) {
      console.error("Dismiss error:", err)
    } finally {
      setDismissingId(null)
    }
  }, [])

  const items = flattenFlaggedItems(data)
  const displayItems = items.slice(0, 5)
  const hiddenCount = items.length - 5

  return (
    <div className="bg-white w-full rounded-[32px] p-4 md:p-6 lg:p-[32px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 md:pb-3 mb-0 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-[#BB0000] flex-shrink-0" />
          <h2
            className="text-sm md:text-base font-bold uppercase tracking-wide text-[#6E6355]"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Properties Requiring Attention
          </h2>
        </div>
        <Link
          href="/requiring-action"
          className="inline-flex items-center gap-2 bg-[#F9F9F7] border border-[#F3F4F4] rounded-xl px-4 py-2 text-sm font-semibold text-[#1F1F1F] hover:bg-gray-100 transition-colors whitespace-nowrap"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          View All
          <ArrowRight className="w-4 h-4 text-[#1F1F1F]" />
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
            Checking for alerts...
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
      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p
            className="text-sm font-semibold text-[#0C1D38]"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            No properties require action
          </p>
          <p
            className="text-xs text-gray-400 mt-0.5 max-w-[220px]"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            All systems are within their expected lifespan.
          </p>
        </div>
      )}

      {/* List */}
      {!isLoading && items.length > 0 && (
        <div className="flex flex-col">
          {displayItems.map(({ property, system }, index) => {
            const tagStyle = getTagStyle(system.alert_tier, system.percentage_used)
            const tagLabel = getSystemLabel(system.system_type)
            const isDismissing = dismissingId === system.system_id

            return (
              <div
                key={system.system_id}
                className={`group grid grid-cols-[52px_1fr_120px_1fr_28px] items-center gap-4 py-[10px] ${
                  index < displayItems.length - 1 ? "border-b border-[#E8ECF0]" : ""
                } hover:bg-orange-50 transition-colors px-2 -mx-2 rounded-lg`}
              >
                {/* Property Image */}
                <div className="relative w-[52px] h-[52px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
                  <Image
                    src="/property-default.png"
                    alt={property.property_name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Address + Location */}
                <div className="min-w-0">
                  <h3
                    className="text-sm font-bold text-[#0C1D38] truncate"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {property.address || property.property_name}
                  </h3>
                  <p
                    className="text-xs text-gray-400 mt-0.5 truncate"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {property.location}
                  </p>
                </div>

                {/* Colored System Tag — fixed 120px width */}
                <div className="w-[120px] flex items-center justify-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 text-[11px] font-bold rounded-full border ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border} whitespace-nowrap`}
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {tagLabel}
                  </span>
                </div>

                {/* Action Label + Timeframe */}
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold text-[#0C1D38] truncate"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {system.action_label}
                  </p>
                  <p
                    className="text-xs text-gray-400 mt-0.5 truncate"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {system.timeframe}
                  </p>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => handleDismiss(system.system_id)}
                  disabled={isDismissing}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 disabled:opacity-50"
                  title="Dismiss"
                >
                  {isDismissing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )
          })}

        </div>
      )}
    </div>
  )
}

export default RequiringActionPanel

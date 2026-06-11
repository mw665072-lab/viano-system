"use client"

import React, { useState, useEffect, useCallback } from "react"
import { X, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { propertyAPI, RequiringActionProperty, FlaggedSystem } from "@/lib/api"

const ITEMS_PER_PAGE = 15

function getTagStyle(alertTier: string, percentageUsed: number) {
  const isTier2 = alertTier === "Tier 2"
  if (isTier2) {
    return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" }
  }
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

function flattenFlaggedItems(data: RequiringActionProperty[]) {
  const items: Array<{ property: RequiringActionProperty; system: FlaggedSystem }> = []
  data.forEach((property) => {
    property.flagged_systems.forEach((system) => {
      items.push({ property, system })
    })
  })
  items.sort((a, b) => {
    const aTier = a.system.alert_tier === "Tier 2" ? 0 : 1
    const bTier = b.system.alert_tier === "Tier 2" ? 0 : 1
    if (aTier !== bTier) return aTier - bTier
    return b.system.percentage_used - a.system.percentage_used
  })
  return items
}

export default function RequiringActionPage() {
  const [data, setData] = useState<RequiringActionProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

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
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const displayItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE)

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
          className="text-xl md:text-2xl font-bold text-[#0C1D38]"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Properties Requiring Attention
        </h1>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
          {items.length}
        </span>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="w-7 h-7 animate-spin text-orange-400" />
          <p className="mt-3 text-sm text-gray-400">Checking for alerts...</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 py-4 px-4 bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-[#0C1D38]">No properties require action</p>
          <p className="text-xs text-gray-400 mt-0.5 max-w-[220px]">
            All systems are within their expected lifespan.
          </p>
        </div>
      )}

      {/* Full-width list */}
      {!isLoading && !error && items.length > 0 && (
        <>
          <div className="flex flex-col">
            {displayItems.map(({ property, system }, index) => {
              const tagStyle = getTagStyle(system.alert_tier, system.percentage_used)
              const tagLabel = getSystemLabel(system.system_type)
              const isDismissing = dismissingId === system.system_id

              return (
                <div
                  key={system.system_id}
                  className={`group grid grid-cols-[52px_1fr_120px_1fr_28px] items-center gap-4 py-[10px] ${
                    index < displayItems.length - 1 ? "border-b border-gray-100" : ""
                  } hover:bg-orange-50/60 transition-colors`}
                >
                  <div className="relative w-[52px] h-[52px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
                    <Image
                      src="/property-default.png"
                      alt={property.property_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#0C1D38] truncate" style={{ fontFamily: "Manrope, sans-serif" }}>
                      {property.address || property.property_name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 truncate" style={{ fontFamily: "Manrope, sans-serif" }}>
                      {property.location}
                    </p>
                  </div>
                  <div className="w-[120px] flex items-center justify-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 text-[11px] font-bold rounded-full border ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border} whitespace-nowrap`}
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {tagLabel}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0C1D38] truncate" style={{ fontFamily: "Manrope, sans-serif" }}>
                      {system.action_label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate" style={{ fontFamily: "Manrope, sans-serif" }}>
                      {system.timeframe}
                    </p>
                  </div>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                    page === currentPage
                      ? "bg-orange-500 text-white"
                      : "border border-gray-200 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

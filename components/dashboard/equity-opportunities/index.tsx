"use client"

import React, { useState, useEffect, useCallback } from "react"
import { ChevronRight, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { propertyAPI, PropertyOpportunityItem } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

export function TopEquityOpportunities() {
  const [properties, setProperties] = useState<PropertyOpportunityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await propertyAPI.getOpportunities()
      setProperties(result.properties)
      setError(null)
    } catch (err) {
      console.error("Equity opportunities fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const displayItems = properties.slice(0, 5)

  return (
    <div className="bg-white dark:bg-[#1a1a1a] dark:border dark:border-white/10 w-full rounded-[32px] p-4 md:p-6 lg:p-[32px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 md:pb-3 mb-0 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg border-[1.5px] border-[#E8730A] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#E8730A]" />
          </div>
          <h2
            className="text-sm md:text-base font-bold uppercase tracking-wide text-[#6E6355]"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Top Appreciating Properties
          </h2>
        </div>
        <Link
          href="/top-appreciating-properties"
          className="inline-flex items-center gap-2 bg-[#F9F9F7] dark:bg-white/5 border border-[#F3F4F4] dark:border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-[#1F1F1F] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          View All
          <ArrowRight className="w-4 h-4 text-[#1F1F1F] dark:text-gray-200" />
        </Link>
      </div>

      {/* Loading — Desktop */}
      {isLoading && (
        <div className="hidden md:flex md:flex-col">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={`grid grid-cols-[44px_52px_minmax(0,1fr)_auto] items-center gap-3 md:gap-4 py-[10px] ${
                index < 4 ? "border-b border-[#E8ECF0] dark:border-white/10" : ""
              } px-2 -mx-2`}
            >
              {/* Rank Badge */}
              <div className="w-11 flex items-center justify-center">
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>

              {/* Property Image */}
              <Skeleton className="w-[52px] h-[52px] rounded-xl" />

              {/* Address + Location */}
              <div className="min-w-0 flex flex-col gap-1.5">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>

              {/* Estimated Gain */}
              <div className="min-w-0 flex flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading — Mobile */}
      {isLoading && (
        <div className="md:hidden space-y-3 mt-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl border border-gray-100 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="py-8 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && properties.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">No equity opportunities found</p>
        </div>
      )}

      {/* List — Desktop */}
      {!isLoading && !error && displayItems.length > 0 && (
        <div className="hidden md:flex md:flex-col">
          {displayItems.map((property, index) => (
            <div
              key={property.property_id}
              className={`group grid grid-cols-[44px_52px_minmax(0,1fr)_auto] items-center gap-3 md:gap-4 py-[10px] ${
                index < displayItems.length - 1 ? "border-b border-[#E8ECF0] dark:border-white/10" : ""
              } hover:bg-emerald-50/60 dark:hover:bg-white/5 transition-colors px-2 -mx-2 rounded-lg`}
            >
              {/* Rank Badge */}
              <div className="w-11 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <span
                    className="text-sm font-bold text-white"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {index + 1}
                  </span>
                </div>
              </div>

              {/* Property Image */}
              <div className="relative w-[52px] h-[52px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-200 dark:bg-white/10">
                <Image
                  src="/property-default-v2.png"
                  alt={property.address}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Address + Location + Bought Date */}
              <div className="min-w-0">
                <h3
                  className="text-sm font-bold text-[#0C1D38] dark:text-white truncate"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {property.address}
                </h3>
                <p
                  className="text-xs text-gray-400 mt-0.5 truncate"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {property.location} · Bought {property.last_sale_date}
                </p>
              </div>

              {/* Estimated Gain */}
              <div className="min-w-0 text-right">
                <p
                  className="text-sm font-bold text-emerald-600 truncate"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  +{property.formatted_gain}
                </p>
                <p
                  className="text-[10px] uppercase text-gray-400 tracking-wide mt-0.5"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Est. Gain
                </p>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* List — Mobile cards */}
      {!isLoading && !error && displayItems.length > 0 && (
        <div className="md:hidden space-y-3 mt-3">
          {displayItems.map((property, index) => (
            <div
              key={property.property_id}
              className="p-4 rounded-2xl border border-gray-100 dark:border-white/10"
            >
              {/* Top row: rank + image + address */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <span
                    className="text-sm font-bold text-white"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-white/10">
                  <Image
                    src="/property-default-v2.png"
                    alt={property.address}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm font-bold text-[#0C1D38] dark:text-white truncate"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {property.address}
                  </h3>
                  <p
                    className="text-xs text-gray-400 mt-0.5 truncate"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {property.location} · Bought {property.last_sale_date}
                  </p>
                </div>
              </div>

              {/* Estimated gain */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                <span
                  className="text-[11px] uppercase text-gray-400 tracking-wide"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Est. Gain
                </span>
                <span
                  className="text-base font-bold text-emerald-600 dark:text-emerald-400"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  +{property.formatted_gain}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {!isLoading && !error && properties.length > 0 && (
        <div className="mt-1 pt-1 border-t border-gray-100 dark:border-white/10">
          <p
            className="text-xs text-black dark:text-gray-400 flex items-center gap-1 leading-tight"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Estimates provided by
            <span className="inline-flex items-center gap-1 font-bold text-black dark:text-gray-200">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              RealEstateApi
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

export default TopEquityOpportunities

"use client"

import React, { useState, useEffect, useCallback } from "react"
import { ChevronRight, TrendingUp, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { propertyAPI, PropertyOpportunityItem } from "@/lib/api"

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
    <div className="bg-white w-full rounded-[32px] p-4 md:p-6 lg:p-[32px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 md:pb-3 mb-0 border-b border-gray-100">
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
          className="inline-flex items-center gap-2 bg-[#F9F9F7] border border-[#F3F4F4] rounded-xl px-4 py-2 text-sm font-semibold text-[#1F1F1F] hover:bg-gray-100 transition-colors whitespace-nowrap"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          View All
          <ArrowRight className="w-4 h-4 text-[#1F1F1F]" />
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
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

      {/* List */}
      {!isLoading && !error && displayItems.length > 0 && (
        <div className="flex flex-col">
          {displayItems.map((property, index) => (
            <div
              key={property.property_id}
              className={`group grid grid-cols-[52px_52px_1fr_1fr_20px] items-center gap-4 py-[10px] ${
                index < displayItems.length - 1 ? "border-b border-[#E8ECF0]" : ""
              } hover:bg-emerald-50/60 transition-colors px-2 -mx-2 rounded-lg`}
            >
              {/* Rank Badge */}
              <div className="w-[52px] flex items-center justify-center">
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
              <div className="relative w-[52px] h-[52px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
                <Image
                  src="/property-default.png"
                  alt={property.address}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Address + Location + Bought Date */}
              <div className="min-w-0">
                <h3
                  className="text-sm font-bold text-[#0C1D38] truncate"
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

      {/* Footer */}
      {!isLoading && !error && properties.length > 0 && (
        <div className="mt-1 pt-1 border-t border-gray-100">
          <p
            className="text-xs text-black flex items-center gap-1 leading-tight"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Estimates provided by
            <span className="inline-flex items-center gap-1 font-bold text-black">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              RentCast
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

export default TopEquityOpportunities

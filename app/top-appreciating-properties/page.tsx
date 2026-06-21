"use client"

import React, { useState, useEffect, useCallback } from "react"
import { TrendingUp, Loader2 } from "lucide-react"
import Image from "next/image"
import { propertyAPI, PropertyOpportunityItem } from "@/lib/api"

const ITEMS_PER_PAGE = 15

export default function TopAppreciatingPropertiesPage() {
  const [properties, setProperties] = useState<PropertyOpportunityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

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

  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const displayItems = properties.slice(startIndex, startIndex + ITEMS_PER_PAGE)

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
          Top Appreciating Properties
        </h1>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
          {properties.length}
        </span>
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
          <p className="text-sm text-gray-400 dark:text-gray-400">No appreciating properties found</p>
        </div>
      )}

      {/* Full-width list */}
      {!isLoading && !error && displayItems.length > 0 && (
        <>
          <div className="flex flex-col">
            {displayItems.map((property, index) => (
              <div
                key={property.property_id}
                className={`group grid grid-cols-[52px_52px_1fr_1fr_20px] items-center gap-4 py-[10px] ${
                  index < displayItems.length - 1 ? "border-b border-gray-100 dark:border-white/10" : ""
                } hover:bg-emerald-50/60 dark:hover:bg-white/5 transition-colors`}
              >
                {/* Rank Badge */}
                <div className="w-[52px] flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <span
                      className="text-sm font-bold text-white"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {startIndex + index + 1}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/10 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                    page === currentPage
                      ? "bg-emerald-500 text-white"
                      : "border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/10 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {/* Footer */}
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
                RentCast
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  )
}

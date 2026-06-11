"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Home, CalendarDays, Target, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { propertyAPI } from "@/lib/api"

interface StatConfig {
  id: string
  title: string
  iconBg: string
  iconColor: string
  barColor: string
  valueColor: string
  link: { label: string; href: string } | null
  linkColor: string
}

const STATS_CONFIG: StatConfig[] = [
  {
    id: "active-properties",
    title: "ACTIVE PROPERTIES",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    barColor: "bg-emerald-500",
    valueColor: "text-emerald-600",
    link: null,
    linkColor: "",
  },
  {
    id: "upcoming-touchpoints",
    title: "UPCOMING TOUCHPOINTS",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    barColor: "bg-blue-500",
    valueColor: "text-blue-600",
    link: { label: "View Touchpoints", href: "/manage-properties" },
    linkColor: "text-blue-600 hover:text-blue-700",
  },
  {
    id: "property-opportunities",
    title: "TOP APPRECIATING",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    barColor: "bg-orange-500",
    valueColor: "text-orange-500",
    link: { label: "View Opportunities", href: "/manage-properties" },
    linkColor: "text-orange-500 hover:text-orange-600",
  },
]

const ICONS: Record<string, React.ReactNode> = {
  "active-properties": <Home className="w-6 h-6 md:w-7 md:h-7" />,
  "upcoming-touchpoints": <CalendarDays className="w-6 h-6 md:w-7 md:h-7" />,
  "property-opportunities": <Target className="w-6 h-6 md:w-7 md:h-7" />,
}

export default function DashboardStatsCard() {
  const [activeCount, setActiveCount] = useState<number>(0)
  const [maxAllowed, setMaxAllowed] = useState<number>(0)
  const [upcomingTouchpoints, setUpcomingTouchpoints] = useState<number>(0)
  const [opportunitiesCount, setOpportunitiesCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [quotaResult, touchpointsResult, opportunitiesResult] = await Promise.all([
        propertyAPI.getBulkUploadQuota(),
        propertyAPI.getUpcomingTouchpoints(180),
        propertyAPI.getOpportunities(),
      ])

      setActiveCount(quotaResult.current_count)
      setMaxAllowed(quotaResult.max_allowed)
      setUpcomingTouchpoints(touchpointsResult.count)
      setOpportunitiesCount(opportunitiesResult.total_opportunities)
    } catch (err) {
      console.error("Stats fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatValue = (id: string): number => {
    switch (id) {
      case "active-properties":
        return activeCount
      case "upcoming-touchpoints":
        return upcomingTouchpoints
      case "property-opportunities":
        return opportunitiesCount
      default:
        return 0
    }
  }

  const getStatMax = (id: string): number => {
    switch (id) {
      case "active-properties":
        return maxAllowed
      default:
        return 0
    }
  }

  const getStatSubtitle = (id: string): string => {
    switch (id) {
      case "active-properties":
        return `of ${maxAllowed} Used`
      case "upcoming-touchpoints":
        return "Next 180 Days"
      case "property-opportunities":
        return "PROPERTIES"
      default:
        return ""
    }
  }

  const getPercentage = (id: string): number => {
    const value = getStatValue(id)
    const max = getStatMax(id)
    if (!max) return 0
    return Math.round((value / max) * 100)
  }

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-[21px]">
      {STATS_CONFIG.map((stat) => {
        const value = getStatValue(stat.id)
        const max = getStatMax(stat.id)
        const percentage = getPercentage(stat.id)

        return (
          <div
            key={stat.id}
            className="bg-white rounded-[24px] p-5 md:p-6 flex flex-col"
          >
            {/* Top: icon + title side by side */}
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${stat.iconBg} flex items-center justify-center flex-shrink-0 ${stat.iconColor}`}
              >
                {ICONS[stat.id]}
              </div>
              <div>
                <h3
                  className="text-xs font-bold uppercase tracking-wider text-gray-500"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {stat.title}
                </h3>
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300 mt-1" />
                ) : (
                  <div className="flex flex-col mt-0.5">
                    <span
                      className={`text-3xl md:text-4xl font-bold leading-tight ${stat.valueColor}`}
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {value}
                    </span>
                    <span
                      className="text-sm text-gray-500 font-medium leading-tight"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {getStatSubtitle(stat.id)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar - only for active-properties */}
            {stat.id === "active-properties" && (
              <div className="mt-4">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stat.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p
                  className="text-xs text-gray-400 mt-1.5"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {percentage}% of your plan
                </p>
              </div>
            )}

            {/* Link for other cards */}
            {stat.link && (
              <div className="mt-4 flex justify-start">
                <Link
                  href={stat.link.href}
                  className={`flex items-center gap-1 text-sm font-semibold ${stat.linkColor} transition-colors whitespace-nowrap`}
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {stat.link.label}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

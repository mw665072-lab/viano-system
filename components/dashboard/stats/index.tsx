"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Home, CalendarDays, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
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
    iconBg: "bg-[#F9F9F7] dark:bg-white/10",
    iconColor: "text-[#3C4653] dark:text-gray-300",
    barColor: "bg-emerald-500",
    valueColor: "text-[#1E1E1E] dark:text-white",
    link: null,
    linkColor: "",
  },
  {
    id: "upcoming-touchpoints",
    title: "UPCOMING TOUCHPOINTS",
    iconBg: "bg-[#F9F9F7] dark:bg-white/10",
    iconColor: "text-[#3C4653] dark:text-gray-300",
    barColor: "bg-emerald-500",
    valueColor: "text-[#1E1E1E] dark:text-white",
    link: { label: "View Touchpoints", href: "/#" },
    linkColor: "text-[#1E1E1E] dark:text-gray-200",
  },
  {
    id: "property-opportunities",
    title: "TOP APPRECIATING",
    iconBg: "bg-[#F9F9F7] dark:bg-white/10",
    iconColor: "text-[#3C4653] dark:text-gray-300",
    barColor: "bg-emerald-500",
    valueColor: "text-[#1E1E1E] dark:text-white",
    link: { label: "View Opportunities", href: "/top-appreciating-properties" },
    linkColor: "text-[#1E1E1E] dark:text-gray-200",
  },
]

const ICONS: Record<string, React.ReactNode> = {
  "active-properties": <Home className="w-6 h-6 md:w-7 md:h-7" />,
  "upcoming-touchpoints": <CalendarDays className="w-6 h-6 md:w-7 md:h-7" />,
  "property-opportunities": (
    <svg viewBox="9 9 18 18" fill="none" className="w-7 h-7 md:w-8 md:h-8" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.1857 21.3581C15.3266 21.4576 15.4878 21.5245 15.6577 21.5539C15.8276 21.5834 16.002 21.5747 16.1681 21.5285C16.3343 21.4823 16.488 21.3997 16.6183 21.2867C16.7486 21.1737 16.8521 21.0332 16.9214 20.8752L17.4714 19.2038C17.6052 18.8017 17.8308 18.4362 18.1303 18.1364C18.4298 17.8367 18.7951 17.6108 19.1971 17.4767L20.7957 16.9574C21.0229 16.8783 21.2194 16.7296 21.3571 16.5324C21.4635 16.3829 21.5328 16.2102 21.5592 16.0286C21.5857 15.847 21.5686 15.6618 21.5094 15.4881C21.4501 15.3144 21.3504 15.1573 21.2185 15.0298C21.0866 14.9022 20.9263 14.8079 20.7507 14.7545L19.1685 14.2402C18.7663 14.1068 18.4007 13.8815 18.1006 13.5822C17.8006 13.2829 17.5744 12.9179 17.44 12.5159L16.9207 10.9181C16.8408 10.6917 16.6926 10.4957 16.4964 10.3574C16.2991 10.2213 16.065 10.1484 15.8253 10.1484C15.5856 10.1484 15.3516 10.2213 15.1543 10.3574C14.9551 10.4982 14.8051 10.6981 14.7257 10.9288L14.2 12.5467C14.0659 12.9381 13.8445 13.294 13.5525 13.5873C13.2606 13.8805 12.9058 14.1036 12.515 14.2395L10.915 14.7581C10.6873 14.8386 10.4904 14.988 10.3516 15.1856C10.2128 15.3832 10.1391 15.6192 10.1406 15.8607C10.1422 16.1022 10.219 16.3371 10.3604 16.5329C10.5017 16.7287 10.7006 16.8756 10.9293 16.9531L12.5121 17.4674C13.0253 17.6396 13.4764 17.9591 13.8093 18.3859C13.9993 18.6309 14.1457 18.9059 14.2421 19.2002L14.7621 20.7959C14.8421 21.0231 14.9907 21.2195 15.1871 21.3581M12.8493 16.4488L11.2635 15.9345C11.2635 15.9345 11.2028 15.9074 11.2028 15.8574C11.2046 15.8396 11.2111 15.8226 11.2216 15.8081C11.2322 15.7937 11.2464 15.7823 11.2628 15.7752L12.8571 15.2574C13.4111 15.0649 13.9133 14.7473 14.3246 14.3292C14.7359 13.9111 15.0452 13.4038 15.2285 12.8467L15.7435 11.2617C15.7435 11.2617 15.7743 11.2017 15.825 11.2017C15.8757 11.2017 15.9057 11.2617 15.9057 11.2617L16.4221 12.8495C16.6089 13.4111 16.9242 13.9213 17.343 14.3395C17.7617 14.7576 18.2724 15.0722 18.8343 15.2581L20.4557 15.7831C20.4713 15.7898 20.4847 15.8007 20.4945 15.8146C20.5044 15.8284 20.5102 15.8447 20.5114 15.8617C20.5088 15.8789 20.5021 15.8953 20.4918 15.9094C20.4814 15.9234 20.4678 15.9348 20.4521 15.9424L18.8628 16.4581C18.3012 16.6444 17.7909 16.9593 17.3725 17.3777C16.9541 17.7962 16.6392 18.3065 16.4528 18.8681L15.9421 20.4395C15.9391 20.4588 15.9291 20.4763 15.9139 20.4886C15.8987 20.5009 15.8795 20.5071 15.86 20.5059C15.7857 20.5059 15.7757 20.4524 15.7757 20.4524L15.2593 18.8667C15.0738 18.3034 14.7592 17.7914 14.3404 17.3716C13.9217 16.9518 13.4105 16.6357 12.8478 16.4488M22.1457 25.7017C22.2912 25.8039 22.465 25.8583 22.6428 25.8574C22.8196 25.8581 22.9922 25.8042 23.1371 25.7031C23.2862 25.5978 23.3978 25.4477 23.4557 25.2745L23.7214 24.4581C23.7776 24.2886 23.8725 24.1345 23.9986 24.008C24.1247 23.8816 24.2785 23.7862 24.4478 23.7295L25.2807 23.4595C25.4489 23.4001 25.5946 23.2901 25.6978 23.1445C25.801 22.999 25.8567 22.8251 25.8571 22.6467C25.8571 22.4638 25.7986 22.2856 25.6901 22.1384C25.5817 21.9911 25.4289 21.8824 25.2543 21.8281L24.4371 21.5638C24.2675 21.5075 24.1134 21.4125 23.9869 21.2863C23.8605 21.1601 23.7652 21.0061 23.7085 20.8367L23.4371 20.0059C23.3786 19.8364 23.2683 19.6895 23.1219 19.5859C22.9755 19.4823 22.8002 19.4273 22.6209 19.4286C22.4415 19.4298 22.2671 19.4873 22.1221 19.5929C21.9771 19.6986 21.869 19.847 21.8128 20.0174L21.5457 20.8359C21.4909 21.0032 21.3985 21.1557 21.2755 21.2817C21.1526 21.4076 21.0023 21.5037 20.8364 21.5624L20.0035 21.8324C19.8352 21.8918 19.6894 22.002 19.5862 22.1477C19.483 22.2933 19.4274 22.4674 19.4271 22.6459C19.4273 22.826 19.4842 23.0014 19.5897 23.1474C19.6952 23.2933 19.844 23.4022 20.015 23.4588L20.8321 23.7245C21.0024 23.7806 21.157 23.876 21.2836 24.003C21.4101 24.1299 21.5051 24.2848 21.5607 24.4552L21.8314 25.2859C21.8905 25.4538 22.0003 25.5991 22.1457 25.7017ZM21.1664 22.7059L20.9735 22.6431L21.1757 22.5745C21.5 22.4622 21.7939 22.2765 22.0347 22.032C22.2754 21.7874 22.4564 21.4905 22.5635 21.1645L22.6264 20.9717L22.69 21.1659C22.7988 21.4947 22.9829 21.7935 23.2277 22.0385C23.4726 22.2834 23.7713 22.4677 24.1 22.5767L24.3093 22.6481L24.1157 22.7102C23.7871 22.8198 23.4886 23.0045 23.2438 23.2497C22.999 23.4948 22.8148 23.7936 22.7057 24.1224L22.6428 24.3152L22.58 24.1209C22.4707 23.7913 22.286 23.4918 22.0404 23.2462C21.7949 23.0007 21.4953 22.8159 21.1657 22.7067" fill="currentColor" />
    </svg>
  ),
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
            className="bg-white dark:bg-[#1a1a1a] dark:border dark:border-white/10 rounded-[24px] p-5 md:p-6 flex flex-col"
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
                  className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {stat.title}
                </h3>
                {isLoading ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <Skeleton className="h-9 md:h-10 w-16 rounded-lg" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                ) : (
                  <div className="flex flex-col mt-0.5">
                    <span
                      className={`text-3xl md:text-4xl font-bold leading-tight ${stat.valueColor}`}
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {value}
                    </span>
                    <span
                      className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight"
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
                <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
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
                  className={`inline-flex items-center gap-2 bg-[#F9F9F7] dark:bg-white/5 border border-[#F3F4F4] dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold ${stat.linkColor} hover:bg-gray-100 dark:hover:bg-white/10 transition-colors whitespace-nowrap`}
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {stat.link.label}
                  <ArrowRight className="w-4 h-4 text-[#E8730A]" />
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

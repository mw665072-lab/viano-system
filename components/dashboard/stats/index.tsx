"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/common/stat-card"
import { propertyAPI, processAPI, PropertyResponse, getCurrentUserId } from "@/lib/api"

interface DashboardStats {
  totalProperties: number
  pendingMessages: number
  issuesIdentified: number
  upcomingClosings: number
  propertyTrend?: { value: number; direction: "up" | "down" }
}

export default function DashboardStatsCard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    pendingMessages: 0,
    issuesIdentified: 0,
    upcomingClosings: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isFirstLoad = true

    const fetchStats = async () => {
      // Only show loading on first load, not on background refreshes
      if (isFirstLoad) {
        setIsLoading(true)
      }

      try {
        const userId = getCurrentUserId()
        if (!userId) {
          setIsLoading(false)
          return
        }

        // Fetch properties
        const properties = await propertyAPI.getUserProperties(userId)

        // Calculate upcoming closings (properties with closing date within 30 days)
        const now = new Date()
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        const upcomingClosings = properties.filter((prop: PropertyResponse) => {
          if (!prop.property_closing_date) return false
          const closingDate = new Date(prop.property_closing_date)
          return closingDate >= now && closingDate <= thirtyDaysFromNow
        }).length

        // Try to fetch process data for pending messages and issues
        let pendingMessages = 0
        let issuesIdentified = 0

        try {
          const processes = await processAPI.getUserProcesses(userId)

          // Count pending processes (not completed)
          pendingMessages = processes.filter(p => p.status !== 'completed').length

          // Fetch actual messages from all completed processes
          const completedProcesses = processes.filter(p => p.status === 'completed')

          // Fetch messages for each completed process in parallel
          const messagePromises = completedProcesses.map(async (process) => {
            try {
              const messages = await processAPI.getMessages(process.process_id)
              return messages.length
            } catch {
              return 0
            }
          })

          const messageCounts = await Promise.all(messagePromises)
          issuesIdentified = messageCounts.reduce((total, count) => total + count, 0)
        } catch (err) {
          console.log('Process API not available, using defaults')
        }

        setStats({
          totalProperties: properties.length,
          pendingMessages,
          issuesIdentified,
          upcomingClosings,
          // Calculate trend (placeholder - would need historical data)
          propertyTrend: properties.length > 0 ? { value: 12, direction: "up" } : undefined,
        })
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
      } finally {
        if (isFirstLoad) {
          setIsLoading(false)
          isFirstLoad = false
        }
      }
    }

    fetchStats()
    // No auto-refresh - stats are fetched only on page load to reduce server load
  }, [])

  const statCards = [
    {
      title: "Total Properties",
      value: isLoading ? "..." : stats.totalProperties.toString(),
      icon: <span className="text-2xl">📦</span>,
      trend: stats.propertyTrend ? {
        value: stats.propertyTrend.value,
        direction: stats.propertyTrend.direction,
        color: stats.propertyTrend.direction === "up" ? "green" as const : "red" as const
      } : undefined,
    },
    {
      title: "Pending Evaluations",
      value: isLoading ? "..." : stats.pendingMessages.toString(),
      icon: <span className="text-2xl">🔍</span>,
      trend: stats.pendingMessages > 0 ? { value: stats.pendingMessages, direction: "down" as const, color: "red" as const } : undefined,
    },
    {
      title: "Issues Identified",
      value: isLoading ? "..." : stats.issuesIdentified.toString(),
      icon: <span className="text-2xl">📋</span>,
      trend: undefined,
    },
  ]

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-[31px]">
        {statCards.map((stat, index) => (
          <StatCard key={index} title={stat.title} value={stat.value} icon={stat.icon} trend={stat.trend} />
        ))}
      </div>
    </div>
  )
}

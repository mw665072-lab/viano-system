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
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const fetchStats = async () => {
      try {
        // Set a timeout to force loading to stop after 10 seconds
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setIsLoading(false)
            console.warn('Stats fetch timeout - setting default values')
          }
        }, 10000)

        const userId = getCurrentUserId()
        if (!userId) {
          if (isMounted) setIsLoading(false)
          return
        }

        // Fetch properties with timeout
        const properties = await Promise.race([
          propertyAPI.getUserProperties(userId),
          new Promise<PropertyResponse[]>((_, reject) =>
            setTimeout(() => reject(new Error('Properties fetch timeout')), 8000)
          )
        ]).catch(() => [] as PropertyResponse[])

        if (!isMounted) return

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
          const processes = await Promise.race([
            processAPI.getUserProcesses(userId),
            new Promise<any[]>((_, reject) =>
              setTimeout(() => reject(new Error('Processes fetch timeout')), 5000)
            )
          ]).catch(() => [])

          if (!isMounted) return

          // Fetch actual messages from all completed processes (limit to first 10 to optimize)
          const completedProcesses = processes.filter(p => p.status === 'completed').slice(0, 10)

          // Fetch messages for each completed process in parallel with individual timeouts
          const messagePromises = completedProcesses.map(async (process) => {
            try {
              const messages = await Promise.race([
                processAPI.getMessages(process.process_id),
                new Promise<any[]>((_, reject) =>
                  setTimeout(() => reject(new Error('Messages fetch timeout')), 3000)
                )
              ])
              // Count pending/scheduled messages (messages not yet sent)
              const pendingMsgs = messages.filter((msg: any) =>
                msg.status === 'pending' || msg.status === 'scheduled'
              ).length
              return { pending: pendingMsgs, total: messages.length }
            } catch {
              return { pending: 0, total: 0 }
            }
          })

          const messageCounts = await Promise.all(messagePromises)
          // Sum up pending messages (SMS to be sent in future)
          pendingMessages = messageCounts.reduce((total, count) => total + count.pending, 0)
          // Sum up total issues identified
          issuesIdentified = messageCounts.reduce((total, count) => total + count.total, 0)
        } catch (err) {
          console.log('Process API not available, using defaults')
        }

        if (!isMounted) return

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
        if (isMounted) {
          clearTimeout(timeoutId)
          setIsLoading(false)
        }
      }
    }

    fetchStats()

    // Cleanup function
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  const statCards = [
    {
      title: "Total Properties",
      value: isLoading ? "..." : stats.totalProperties.toString(),
      icon: <span className="text-2xl">🏠</span>,
      trend: stats.propertyTrend ? {
        value: stats.propertyTrend.value,
        direction: stats.propertyTrend.direction,
        color: stats.propertyTrend.direction === "up" ? "green" as const : "red" as const
      } : undefined,
    },
    {
      title: "Pending SMS (180 days)",
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

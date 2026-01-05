"use client"

import { StatCard } from "@/common/stat-card"
import { TrendingUp, AlertCircle, Calendar, HomeIcon } from "lucide-react"

export default function DashboardStatsCard() {
  const stats = [
    {
      title: "Total Properties",
      value: "19",
      icon: <HomeIcon size={24} className="text-amber-500" />,
      trend: { value: 12, direction: "up" as const, color: "green" as const },
    },
    {
      title: "Pending Messages",
      value: "5",
      icon: <TrendingUp size={24} className="text-blue-400" />,
    //   trend: { value: 40, direction: "down" as const, color: "red" as const },
    },
    {
      title: "Issues Identified",
      value: "12",
      icon: <AlertCircle size={24} className="text-blue-400" />,
      trend: undefined,
    },
    // {
    //   title: "Upcoming Closings",
    //   value: "2",
    //   icon: <Calendar size={24} className="text-teal-500" />,
    //   trend: undefined,
    // },
  ]

  return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} title={stat.title} value={stat.value} icon={stat.icon} trend={stat.trend} />
          ))}
        </div>
      </div>
  )
}

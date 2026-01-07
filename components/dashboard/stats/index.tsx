"use client"

import { StatCard } from "@/common/stat-card"

export default function DashboardStatsCard() {
  const stats = [
    {
      title: "Total Properties",
      value: "19",
      icon: <span className="text-2xl">📦</span>,
      trend: { value: 12, direction: "up" as const, color: "green" as const },
    },
    {
      title: "Pending Analysis",
      value: "5",
      icon: <span className="text-2xl">🔍</span>,
      trend: { value: 40, direction: "down" as const, color: "red" as const },
    },
    {
      title: "Issues Identified",
      value: "12",
      icon: <span className="text-2xl">📋</span>,
      trend: undefined,
    },
    {
      title: "Upcoming Closings",
      value: "2",
      icon: <span className="text-2xl">📅</span>,
      trend: undefined,
    },
  ]

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-[31px]">
        {stats.map((stat, index) => (
          <StatCard key={index} title={stat.title} value={stat.value} icon={stat.icon} trend={stat.trend} />
        ))}
      </div>
    </div>
  )
}

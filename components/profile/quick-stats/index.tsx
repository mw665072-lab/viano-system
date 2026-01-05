import { Card } from "@/components/ui/card"

export default function QuickStats() {
  const stats = [
    {
      label: "Total Audits",
      value: "47",
      trend: "up",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Completed",
      value: "42",
      trend: "neutral",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Pending",
      value: "3",
      trend: "neutral",
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      label: "Issues Found",
      value: "2",
      trend: "neutral",
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
  ]

  return (
    <Card className="p-6 bg-white shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Stats</h2>

      <div className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`${stat.bgColor} p-2 rounded-full`}>
              <div className={`${stat.color} font-semibold text-sm`}>
                {stat.trend === "up" && "↑ 8%"}
                {stat.trend === "neutral" && ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

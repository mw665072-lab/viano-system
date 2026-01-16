import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

export default function AuditHistory() {
  const audits = [
    {
      name: "Parkland Beach House",
      type: "Estate Evaluation",
      date: "2024-01-15",
      status: "completed",
      initial: "P",
    },
    {
      name: "Lakeview Cabin",
      type: "Safety Audit",
      date: "2024-01-10",
      status: "pending",
      initial: "L",
    },
    {
      name: "Mountain Retreat",
      type: "4 Point Evaluation",
      date: "2024-01-05",
      status: "completed",
      initial: "M",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700"
      case "pending":
        return "bg-amber-100 text-amber-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <Card className="p-6 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Audit History</h2>
        <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-4">
        {audits.map((audit, index) => (
          <div key={index} className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-b-0">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600">{audit.initial}</span>
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{audit.name}</h3>
              <p className="text-xs text-gray-600 mt-1">{audit.type}</p>
              <p className="text-xs text-gray-500 mt-1">{audit.date}</p>
            </div>

            <Badge className={`${getStatusColor(audit.status)} text-xs capitalize rounded-full`}>{audit.status}</Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}

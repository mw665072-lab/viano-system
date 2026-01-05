"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Notification {
  id: number
  title: string
  description: string
  timestamp: string
  status: "completed" | "pending"
  isHighlighted: boolean
}

interface NotificationCardProps {
  notification: Notification
}

export function NotificationCard({ notification }: any) {
  const statusColor = notification.status === "completed" ? "bg-green-500" : "bg-gray-400"

  return (
    <div
      className={cn(
        "rounded-[16px] border p-[20px] md:h-[129px] h-auto flex items-center transition-all opacity-100 bg-white",
        notification.isHighlighted ? "border-blue-500 bg-blue-50" : "border-[#D9D9D9] bg-white",
      )}
      style={{ transform: 'rotate(0deg)' }}
    >
      <div className="flex gap-[17px] w-full items-start">
        {/* Status Indicator */}
        <div className="flex-shrink-0 mt-1">
          <div className={cn("w-3 h-3 rounded-full", statusColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-[#1E1E1E] text-[16px] leading-6 tracking-normal" style={{ fontFamily: 'Inter', fontWeight: 600 }}>{notification.title}</h3>
            <span className="text-muted-foreground text-[12px] leading-[18px] tracking-normal whitespace-nowrap flex-shrink-0" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
              {notification.timestamp}
            </span>
          </div>

          <p className="text-[14px] leading-[21px] mb-4" style={{ color: '#666666', fontFamily: 'Inter', fontWeight: 400 }}>{notification.description}</p>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {notification.status === "completed" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent font-semibold text-xs"
              >
                MARK AS READ
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-red-500 hover:text-red-600 hover:bg-transparent font-semibold text-xs"
            >
              DELETE
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

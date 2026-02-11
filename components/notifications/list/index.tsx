"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { NotificationCard } from "../card"
import { processAPI, getCurrentUserId, MessageResponse, ProcessSummaryResponse } from "@/lib/api"
import { Loader2, Bell, RefreshCw } from "lucide-react"

interface NotificationItem {
  id: number
  title: string
  description: string
  timestamp: string
  status: "completed" | "pending" | "failed" // Match display statuses
  isHighlighted: boolean
  propertyId?: string
  messageId?: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real notifications from API (messages from completed processes)
  const fetchNotifications = useCallback(async () => {
    try {
      const userId = getCurrentUserId()
      if (!userId) {
        setError("Please login to view notifications")
        setIsLoading(false)
        return
      }

      // Fetch all user processes
      let processes: ProcessSummaryResponse[] = []
      try {
        processes = await processAPI.getUserProcesses(userId)
      } catch (err) {
        console.log("Could not fetch processes")
        setNotifications([])
        setIsLoading(false)
        return
      }

      // Get messages from completed processes (limit to avoid too many API calls)
      const completedProcesses = processes
        .filter((p) => p.status === "completed")
        .slice(0, 10)

      if (completedProcesses.length === 0) {
        setNotifications([])
        setIsLoading(false)
        return
      }

      // Fetch messages for each completed process
      const allNotifications: NotificationItem[] = []
      let idCounter = 1

      for (const process of completedProcesses) {
        try {
          const messages = await processAPI.getMessages(process.process_id)

          messages.forEach((msg: MessageResponse) => {
            // Determine status based on message status
            let status = "pending"
            if (msg.status === "sent" || msg.status === "delivered") {
              status = "completed"
            } else if (msg.status === "scheduled") {
              status = "pending"
            } else if (msg.status === "failed") {
              status = "failed"
            }

            // Format timestamp
            let timestamp = "Scheduled"
            if (msg.scheduled_for) {
              const scheduledDate = new Date(msg.scheduled_for)
              const now = new Date()
              const diffDays = Math.ceil(
                (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              )

              if (diffDays > 0) {
                timestamp = `Scheduled in ${diffDays} day${diffDays > 1 ? "s" : ""}`
              } else if (diffDays === 0) {
                timestamp = "Scheduled for today"
              } else {
                timestamp = new Date(msg.scheduled_for).toLocaleDateString()
              }
            } else if (msg.created_at) {
              const createdDate = new Date(msg.created_at)
              const now = new Date()
              const diffHours = Math.floor(
                (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60)
              )

              if (diffHours < 1) {
                timestamp = "Just now"
              } else if (diffHours < 24) {
                timestamp = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
              } else {
                const diffDays = Math.floor(diffHours / 24)
                timestamp = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
              }
            }

            // Get priority label
            let priorityLabel = ""
            switch (msg.priority_level) {
              case 1:
                priorityLabel = "🔴 Critical: "
                break
              case 2:
                priorityLabel = "🟠 High Priority: "
                break
              case 3:
                priorityLabel = "🟡 Medium: "
                break
              case 4:
                priorityLabel = "🟢 Low: "
                break
            }

            allNotifications.push({
              id: idCounter++,
              title: `${priorityLabel}Scheduled SMS`,
              description: msg.message_text.slice(0, 150) + (msg.message_text.length > 150 ? "..." : ""),
              timestamp,
              status,
              isHighlighted: msg.priority_level === 1,
              propertyId: process.property_id,
              messageId: msg.message_id,
            })
          })
        } catch (err) {
          console.log(`Could not fetch messages for process ${process.process_id}`)
        }
      }

      // Sort by highlighting and then by timestamp
      allNotifications.sort((a, b) => {
        if (a.isHighlighted && !b.isHighlighted) return -1
        if (!a.isHighlighted && b.isHighlighted) return 1
        return 0
      })

      setNotifications(allNotifications)
    } catch (err) {
      console.error("Error fetching notifications:", err)
      setError(err instanceof Error ? err.message : "Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500">Loading notifications...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setIsLoading(true)
              fetchNotifications()
            }}
            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications Yet</h3>
        <p className="text-gray-500 text-center max-w-sm">
          When your properties are processed, scheduled SMS notifications will appear here.
        </p>
      </div>
    )
  }

  // Handle notification deletion
  const handleDeleteNotification = async (messageId: string) => {
    try {
      await processAPI.deleteMessage(messageId)

      // Update local state by removing the deleted notification
      setNotifications((prev) =>
        prev.filter((n) => n.messageId !== messageId)
      )
    } catch (err) {
      console.error("Failed to delete notification:", err)
      alert("Failed to delete notification. Please try again.")
    }
  }

  return (
    <div className="max-w-full">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => {
            setIsLoading(true)
            fetchNotifications()
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onDelete={handleDeleteNotification}
          />
        ))}
      </div>
    </div>
  )
}

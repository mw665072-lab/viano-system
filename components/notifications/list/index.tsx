import { NotificationCard } from "../card"

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      title: "Property Inspection Completed",
      description:
        "Wayland Beach House Inspection has been completed successfully. All systems are functioning properly.",
      timestamp: "2 hours ago",
      status: "completed",
      isHighlighted: false,
    },
    {
      id: 2,
      title: "Property Inspection Pending",
      description: "The inspection report for Maple Grove Villa is awaiting review. Please check the findings.",
      timestamp: "1 hour ago",
      status: "pending",
      isHighlighted: false,
    },
  ]

  return (
      <div className="max-w-full">
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </div>
      </div>
  )
}

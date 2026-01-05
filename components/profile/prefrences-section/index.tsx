"use client"

import { Card } from "@/components/ui/card"
import { useState } from "react"

export default function PreferencesSection() {
  const [preferences, setPreferences] = useState({
    email: true,
    sms: false,
    weekly: true,
    marketing: false,
  })

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const preferenceItems = [
    {
      label: "Email Notifications",
      key: "email" as const,
      description: "Receive audit updates via email",
    },
    {
      label: "SMS Notifications",
      key: "sms" as const,
      description: "Receive alerts via text message",
    },
    {
      label: "Weekly Reports",
      key: "weekly" as const,
      description: "Get weekly summary reports",
    },
    {
      label: "Marketing Emails",
      key: "marketing" as const,
      description: "Receive product updates and offers",
    },
  ]

  return (
    <Card className="p-6 bg-white shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Preferences</h2>

      <div className="space-y-4">
        {preferenceItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-b-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
            <button
              onClick={() => togglePreference(item.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences[item.key] ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences[item.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}

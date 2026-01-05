import AuditHistory from '@/components/profile/audit-history'
import PreferencesSection from '@/components/profile/prefrences-section'
import ProfileCard from '@/components/profile/profile-card'
import QuickStats from '@/components/profile/quick-stats'
import React from 'react'

const page = () => {
  return (
   <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <ProfileCard />
            <AuditHistory />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <QuickStats />
            <PreferencesSection />
          </div>
        </div>
      </div>
    </div>
  )
}

export default page

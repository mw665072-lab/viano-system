import AuditHistory from "@/components/profile/audit-history"
import PreferencesSection from "@/components/profile/prefrences-section"
import ProfileCard from "@/components/profile/profile-card"
import QuickStats from "@/components/profile/quick-stats"

const page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 md:p-8 p-0">
      <div className="max-w-full mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4 space-y-6">
            <ProfileCard />
            <AuditHistory />
          </div>

          {/* Right Column */}
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4 space-y-6">
            <QuickStats />
            <PreferencesSection />
          </div>

        </div>
      </div>
    </div>
  )
}


export default page
import AuditHistory from "@/components/profile/audit-history"
import PreferencesSection from "@/components/profile/prefrences-section"
import ProfileCard from "@/components/profile/profile-card"
import QuickStats from "@/components/profile/quick-stats"

const page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto gap-4 lg:gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <ProfileCard />
          </div>


        </div>
      </div>
    </div>
  )
}


export default page
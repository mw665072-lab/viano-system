import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Image from "next/image"

export default function ProfileCard() {
  return (
    <Card className="p-6 sm:p-8 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Profile Image and Basic Info */}
        <div className="flex-shrink-0 flex justify-center sm:justify-start">
          <div className="relative w-24 h-24">
            <Image src="/professional-woman-profile-photo.jpg" alt="Leslie John" fill className="rounded-full object-cover" />
            <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 text-center sm:text-left">Leslie John</h1>
          <p className="text-sm text-gray-600 mb-6 text-center sm:text-left">Property Evaluation Specialist</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
              <p className="text-sm text-gray-900 mt-1">leslie.john@example.com</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</p>
              <p className="text-sm text-gray-900 mt-1">+1 (555) 123-4567</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Member Since</p>
              <p className="text-sm text-gray-900 mt-1">January 2023</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</p>
              <p className="text-sm text-gray-900 mt-1">Miami, FL</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-2">Edit Profile</Button>
            <Button variant="outline" className="rounded-md px-6 py-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
              Account Settings
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

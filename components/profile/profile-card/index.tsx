import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail, Phone, MapPin, Calendar, Award, Briefcase, Star } from "lucide-react"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
   

      <div className="max-w-full mx-auto px-4 py-6 md:py-10">
        {/* Profile Header Card */}
        <Card className="bg-white shadow-sm rounded-3xl p-6 md:p-8 mb-6">
          <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 p-1">
                <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-4xl font-bold text-slate-600">
                  LJ
                </div>
              </div>
              <div className="absolute bottom-1 right-1 bg-blue-600 rounded-full p-1.5 shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Leslie John</h1>
                <p className="text-base text-gray-600 mt-1 flex items-center justify-center md:justify-start gap-2">
                  <Briefcase className="w-4 h-4" />
                  Property Evaluation Specialist
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-50 p-2 rounded-lg">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="text-sm font-semibold text-gray-900">4.9/5.0</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-green-50 p-2 rounded-lg">
                    <Award className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Projects</p>
                    <p className="text-sm font-semibold text-gray-900">247</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium shadow-sm">
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-xl px-6 py-2.5 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Account Settings
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information Grid */}
        <div className="grid md:grid-cols-1 gap-6 mb-6">
          {/* Contact Details */}
          <Card className="bg-white shadow-sm rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2.5 rounded-xl">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="text-sm text-gray-900 mt-1 break-all">leslie.john@example.com</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-green-50 p-2.5 rounded-xl">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                  <p className="text-sm text-gray-900 mt-1">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-purple-50 p-2.5 rounded-xl">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</p>
                  <p className="text-sm text-gray-900 mt-1">Miami, FL</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-orange-50 p-2.5 rounded-xl">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member Since</p>
                  <p className="text-sm text-gray-900 mt-1">January 2023</p>
                </div>
              </div>
            </div>
          </Card>

        </div>

    
      </div>
    </div>
  )
}
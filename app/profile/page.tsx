"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil, ChevronRight, Loader2 } from "lucide-react"
import Image from "next/image"
import { authAPI, processAPI, propertyAPI, UserResponse, ProcessSummaryResponse, PropertyResponse, getCurrentUserId } from "@/lib/api"

interface ProfileData {
  name: string;
  role: string;
  email: string;
  phone: string;
  joined: string;
  location: string;
  avatar: string;
}

interface AuditItem {
  name: string;
  type: string;
  date: string;
  status: string;
  initial: string;
  propertyId: string;
}

interface StatItem {
  label: string;
  value: string;
  trend: string | null;
  trendColor: string | null;
  indicator: string | null;
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    role: "Property Evaluation Specialist",
    email: "",
    phone: "",
    joined: "",
    location: "Florida, US",
    avatar: "/profile-placeholder.jpg"
  });

  const [preferences, setPreferences] = useState({
    email: true,
    sms: false,
    weekly: true,
    marketing: false,
  });

  const [audits, setAudits] = useState<AuditItem[]>([]);

  const [stats, setStats] = useState<StatItem[]>([
    { label: "TOTAL AUDITS", value: "0", trend: null, trendColor: null, indicator: null },
    { label: "COMPLETED", value: "0", trend: null, trendColor: null, indicator: "bg-green-500" },
    { label: "PENDING", value: "0", trend: null, trendColor: null, indicator: "bg-amber-400" },
    { label: "IN PROGRESS", value: "0", trend: null, trendColor: null, indicator: "bg-blue-500" },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user ID from localStorage
        const userId = getCurrentUserId();
        if (!userId) {
          setError('User not logged in. Please login first.');
          setIsLoading(false);
          return;
        }

        // 1. Fetch User Profile from API
        const userData: UserResponse = await authAPI.getUser(userId);

        // Format the date
        const joinedDate = userData.created_at
          ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : 'N/A';

        setProfile({
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
          role: userData.role || 'Property Evaluation Specialist',
          email: userData.email || '',
          phone: userData.mobile_number || 'Not provided',
          joined: joinedDate,
          location: 'Florida, US',
          avatar: '/profile-placeholder.jpg'
        });

        // 2. Fetch User Processes from API
        let processesData: ProcessSummaryResponse[] = [];
        try {
          processesData = await processAPI.getUserProcesses(userId);
        } catch (e) {
          console.log('No processes found or error fetching processes');
          processesData = [];
        }

        // 3. Fetch User Properties to get property names
        let propertiesData: PropertyResponse[] = [];
        try {
          propertiesData = await propertyAPI.getUserProperties(userId);
        } catch (e) {
          console.log('No properties found or error fetching properties');
          propertiesData = [];
        }

        // Create a map of property_id to property_name
        const propertyMap = new Map<string, string>();
        propertiesData.forEach(prop => {
          propertyMap.set(prop.property_id, prop.property_name);
        });

        // Transform processes to audit format
        const auditItems: AuditItem[] = processesData.slice(0, 5).map((process) => ({
          name: propertyMap.get(process.property_id) || 'Property',
          type: '4 Point Evaluation',
          date: process.process_start
            ? new Date(process.process_start).toLocaleDateString('en-US')
            : 'N/A',
          status: process.status,
          initial: (propertyMap.get(process.property_id) || 'P').charAt(0).toUpperCase(),
          propertyId: process.property_id,
        }));
        setAudits(auditItems);

        // 4. Calculate Stats from processes
        const completed = processesData.filter(p => p.status === 'completed').length;
        const pending = processesData.filter(p => p.status === 'pending').length;
        const inProgress = processesData.filter(p => p.status === 'in_progress' || p.status === 'processing').length;

        setStats([
          { label: "TOTAL AUDITS", value: String(processesData.length), trend: null, trendColor: null, indicator: null },
          { label: "COMPLETED", value: String(completed), trend: null, trendColor: null, indicator: "bg-green-500" },
          { label: "PENDING", value: String(pending), trend: null, trendColor: null, indicator: "bg-amber-400" },
          { label: "IN PROGRESS", value: String(inProgress), trend: null, trendColor: null, indicator: "bg-blue-500" },
        ]);

      } catch (err) {
        console.error("Failed to fetch data from API:", err);
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const togglePreference = async (key: keyof typeof preferences) => {
    // Optimistic UI update
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  const preferenceItems = [
    { label: "Email Notifications", key: "email" as const },
    { label: "SMS Notifications", key: "sms" as const },
    { label: "Weekly Reports", key: "weekly" as const },
    { label: "Marketing Emails", key: "marketing" as const },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200"
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "in_progress":
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "failed":
      case "error":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "Completed";
      case "pending": return "Pending";
      case "in_progress": return "In Progress";
      case "processing": return "Processing";
      case "failed": return "Failed";
      case "error": return "Error";
      default: return status;
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <Button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Main Content Area with curved background */}
      <div className="relative">
        {/* Background Container */}
        <div
          className="absolute top-0 left-0 right-0 bottom-0 bg-white rounded-tl-[32px]"
          style={{ marginLeft: '0px' }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <header className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4 lg:py-6">
            <div className="flex items-center gap-3">
              <button className="text-blue-600 hover:text-blue-700 transition-colors">
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Profile</h1>
            </div>
          </header>

          {/* Main Grid Layout */}
          <div className="px-4 sm:px-6 lg:px-10 pb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column */}
              <div className="flex-1 flex flex-col gap-6 lg:max-w-[753px]">
                {/* Profile Info Container */}
                <Card
                  className="bg-white shadow-sm border-0"
                  style={{
                    borderRadius: '32px',
                    padding: '31px 32px',
                  }}
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Profile Image */}
                    <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-200">
                        <Image
                          src="/profile-placeholder.jpg"
                          alt="Profile"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
                            target.parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center text-3xl font-bold text-white">${initials}</div>`;
                          }}
                        />
                      </div>
                      <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                        <Pencil className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.name}</h2>
                      <p className="text-gray-500 mt-1">{profile.role}</p>

                      {/* Contact Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">EMAIL</p>
                          <p className="text-sm text-gray-900 mt-1">{profile.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">PHONE</p>
                          <p className="text-sm text-gray-900 mt-1">{profile.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">MEMBER SINCE</p>
                          <p className="text-sm text-gray-900 mt-1">{profile.joined}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">LOCATION</p>
                          <p className="text-sm text-gray-900 mt-1">{profile.location}</p>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2.5 text-sm font-medium">
                          Edit Profile
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-lg px-6 py-2.5 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Account Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Audit History Container */}
                <Card
                  className="bg-white shadow-sm border-0"
                  style={{
                    borderRadius: '32px',
                    padding: '32px',
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Audit History</h2>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {audits.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No audit history yet.</p>
                      <p className="text-sm mt-1">Your completed audits will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {audits.map((audit, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-600">{audit.initial}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900">{audit.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{audit.type}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{audit.date}</p>
                          </div>

                          <Badge
                            className={`${getStatusColor(audit.status)} text-xs capitalize rounded-md px-3 py-1 font-medium border`}
                          >
                            {getStatusLabel(audit.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Column */}
              <div className="w-full lg:w-[326px] flex flex-col gap-6">
                {/* Quick Stats Container */}
                <Card
                  className="bg-white shadow-sm border-0"
                  style={{
                    borderRadius: '32px',
                    padding: '24px',
                  }}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Stats</h2>

                  <div className="space-y-6">
                    {stats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                        <div className="flex items-center">
                          {stat.trend && (
                            <span className={`text-sm font-medium ${stat.trendColor}`}>
                              {stat.trend} <span className="inline-block transform rotate-45">↗</span>
                            </span>
                          )}
                          {stat.indicator && (
                            <div className={`w-3 h-3 rounded-full ${stat.indicator}`} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Preferences Container */}
                <Card
                  className="bg-white shadow-sm border-0"
                  style={{
                    borderRadius: '32px',
                    padding: '24px',
                  }}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Preferences</h2>

                  <div className="space-y-5">
                    {preferenceItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <p className="text-sm text-gray-700">{item.label}</p>
                        <button
                          onClick={() => togglePreference(item.key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences[item.key] ? "bg-blue-600" : "bg-gray-300"
                            }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${preferences[item.key] ? "translate-x-5" : "translate-x-0.5"
                              }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
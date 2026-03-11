"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
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

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [allAudits, setAllAudits] = useState<AuditItem[]>([]);
  const [imageError, setImageError] = useState(false);

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

        setProfile({
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
          role: userData.role || 'Property Evaluation Specialist',
          email: userData.email || '',
          phone: userData.mobile_number || 'Not provided',
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

        // Create a map of property_id to the MOST RECENT process record
        const latestProcessMap = new Map<string, ProcessSummaryResponse>();
        processesData.forEach(proc => {
          const existing = latestProcessMap.get(proc.property_id);
          if (!existing || (proc.process_start && existing.process_start && new Date(proc.process_start) > new Date(existing.process_start))) {
            latestProcessMap.set(proc.property_id, proc);
          }
        });

        // Transform ALL properties to audit format (ensures count matches Total Properties)
        const transformedAudits: AuditItem[] = propertiesData.map((prop) => {
          const process = latestProcessMap.get(prop.property_id);
          return {
            name: prop.property_name || 'Property',
            type: '4 Point Evaluation',
            date: process?.process_start
              ? new Date(process.process_start).toLocaleDateString('en-US')
              : 'N/A',
            status: process?.status || 'pending',
            initial: (prop.property_name || 'P').charAt(0).toUpperCase(),
            propertyId: prop.property_id,
          };
        });

        setAllAudits(transformedAudits);
        setAudits(transformedAudits.slice(0, 5));

        // 4. Calculate Stats from properties using the LATEST process for each
        const propertyStatuses = propertiesData.map(prop => {
          const process = latestProcessMap.get(prop.property_id);
          return process?.status?.toLowerCase() || 'pending';
        });

        const completedCount = propertyStatuses.filter(s => s === 'completed').length;
        const pendingCount = propertyStatuses.filter(s => s === 'pending').length;
        const inProgressCount = propertyStatuses.filter(s =>
          ['started', 'downloading', 'generating_messages', 'storing_messages', 'in_progress', 'processing', 'paused'].includes(s)
        ).length;

        setStats([
          { label: "TOTAL PROPERTIES", value: String(propertiesData.length), trend: null, trendColor: null, indicator: null },
          { label: "COMPLETED", value: String(completedCount), trend: null, trendColor: null, indicator: "bg-green-500" },
          { label: "PENDING", value: String(pendingCount), trend: null, trendColor: null, indicator: "bg-amber-400" },
          { label: "PROCESSING", value: String(inProgressCount), trend: null, trendColor: null, indicator: "bg-blue-500" },
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

  // Use ref to track if there are active audits (avoids stale closure)
  const hasActiveAuditRef = React.useRef(false);

  // All statuses that indicate an active/in-progress audit (not completed or failed)
  const ACTIVE_STATUSES = ['pending', 'started', 'downloading', 'generating_messages', 'storing_messages', 'in_progress', 'processing'];

  // Update the ref whenever audits change
  useEffect(() => {
    const hasActive = audits.some(a =>
      a.status &&
      ACTIVE_STATUSES.includes(a.status)
    );
    hasActiveAuditRef.current = hasActive;
    console.log('Profile: Active audit check:', hasActive, 'statuses:', audits.map(a => a.status));
  }, [audits]);

  // Fetch function to refresh profile data
  const refreshProfileData = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    console.log('Profile Polling: Active audit detected, fetching fresh data...');

    try {
      // Fetch fresh processes data
      const processesData = await processAPI.getUserProcesses(userId);
      const propertiesData = await propertyAPI.getUserProperties(userId);

      // Create a map of property_id to the MOST RECENT process record
      const latestProcessMap = new Map<string, ProcessSummaryResponse>();
      processesData.forEach(proc => {
        const existing = latestProcessMap.get(proc.property_id);
        if (!existing || (proc.process_start && existing.process_start && new Date(proc.process_start) > new Date(existing.process_start))) {
          latestProcessMap.set(proc.property_id, proc);
        }
      });

      // Update audits based on properties (ensures consistency)
      const transformedAudits = propertiesData.map((prop) => {
        const process = latestProcessMap.get(prop.property_id);
        return {
          name: prop.property_name || 'Property',
          type: '4 Point Evaluation',
          date: process?.process_start
            ? new Date(process.process_start).toLocaleDateString('en-US')
            : 'N/A',
          status: process?.status || 'pending',
          initial: (prop.property_name || 'P').charAt(0).toUpperCase(),
          propertyId: prop.property_id,
        };
      });

      setAllAudits(transformedAudits);
      setAudits(transformedAudits.slice(0, 5));

      // Update stats based on properties using the LATEST process for each
      const propertyStatuses = propertiesData.map(prop => {
        const process = latestProcessMap.get(prop.property_id);
        return process?.status?.toLowerCase() || 'pending';
      });

      const completedCount = propertyStatuses.filter(s => s === 'completed').length;
      const pendingCount = propertyStatuses.filter(s => s === 'pending').length;
      const inProgressCount = propertyStatuses.filter(s =>
        ['started', 'downloading', 'generating_messages', 'storing_messages', 'in_progress', 'processing', 'paused'].includes(s)
      ).length;

      setStats([
        { label: "TOTAL PROPERTIES", value: String(propertiesData.length), trend: null, trendColor: null, indicator: null },
        { label: "COMPLETED", value: String(completedCount), trend: null, trendColor: null, indicator: "bg-green-500" },
        { label: "PENDING", value: String(pendingCount), trend: null, trendColor: null, indicator: "bg-amber-400" },
        { label: "PROCESSING", value: String(inProgressCount), trend: null, trendColor: null, indicator: "bg-blue-500" },
      ]);
    } catch (err) {
      console.error('Profile Polling: Error refreshing data', err);
    }
  }, []);

  // Always running polling - checks ref for active audits
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Check ref (not stale closure) for active audits
      if (hasActiveAuditRef.current) {
        await refreshProfileData();
      }
    }, 30000); // 30 seconds - only polls when there are active processes

    return () => clearInterval(pollInterval);
  }, [refreshProfileData]);

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
      case "in_progress": return "Processing"; // Map to Processing for consistency
      case "processing": return "Processing";
      case "paused": return "Paused";
      case "failed": return "Failed";
      case "error": return "Error";
      case "insufficient_credits": return "Credits Exhausted";
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
          className="absolute top-0 left-0 right-0 bottom-0 bg-white rounded-t-[24px] md:rounded-tl-[32px] md:rounded-tr-none"
          style={{ marginLeft: '0px' }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Header removed to avoid duplication with Layout header */}

          {/* Main Grid Layout */}
          <div className="px-4 sm:px-6 lg:px-10 pb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column */}
              <div className="flex-1 flex flex-col gap-6 lg:max-w-[753px]">
                {/* Profile Info Container */}
                <Card
                  className="bg-white shadow-sm border-0 rounded-[24px] md:rounded-[32px] p-5 md:p-8"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Profile Image */}
                    <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-200">
                        {imageError ? (
                          <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center text-3xl font-bold text-white">
                            {profile.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                          </div>
                        ) : (
                          <Image
                            src="/profile-placeholder.jpg"
                            alt="Profile"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                          />
                        )}
                      </div>
                      <button className="hidden sm:flex absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
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
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">LOCATION</p>
                          <p className="text-sm text-gray-900 mt-1">{profile.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Audit History Container */}
                <Card
                  className="bg-white shadow-sm border-0 rounded-[24px] md:rounded-[32px] p-5 md:p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Audit History</h2>
                    <button
                      onClick={() => setIsAuditModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
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
                  className="bg-white shadow-sm border-0 rounded-[24px] md:rounded-[32px] p-6"
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
                  className="bg-white shadow-sm border-0 rounded-[24px] md:rounded-[32px] p-6"
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

      {/* Audit History Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAuditModalOpen(false)}
          />

          {/* Modal Content */}
          <Card className="relative w-full max-w-2xl bg-white shadow-2xl rounded-[24px] md:rounded-[32px] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Full Audit History</h2>
                <p className="text-sm text-gray-500 mt-1">Total {allAudits.length} evaluations recorded</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAuditModalOpen(false)}
                className="rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6 text-gray-400 rotate-90 sm:rotate-0" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
              {allAudits.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No audit history found.</p>
                </div>
              ) : (
                allAudits.map((audit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
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
                ))
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end sticky bottom-0">
              <Button
                onClick={() => setIsAuditModalOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeft, Pencil, ChevronRight, Loader2, CheckCircle, XCircle, Mail, Smartphone } from "lucide-react"
import Image from "next/image"
import { authAPI, processAPI, propertyAPI, billingAPI, UserResponse, ProcessSummaryResponse, PropertyResponse, BillingStatusResponse, UpdateUserRequest, getCurrentUserId } from "@/lib/api"
import { CreditCard, ExternalLink, ShieldCheck, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { OTPInput } from "@/components/ui/otp-input"

interface ProfileData {
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  emailVerified: boolean;
  phoneVerified: boolean;
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
  const [billingStatus, setBillingStatus] = useState<BillingStatusResponse | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    role: "Property Evaluation Specialist",
    email: "",
    phone: "",
    avatar: "",
    emailVerified: false,
    phoneVerified: false,
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

  // Edit profile modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    mobile_number: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // OTP verification modal state
  const [otpModal, setOtpModal] = useState<{
    open: boolean;
    type: 'email' | 'phone' | 'phone_update' | null;
    otp: string;
    isSending: boolean;
    isVerifying: boolean;
    error: string | null;
    resent: boolean;
    resendTimer: number;
  }>({
    open: false,
    type: null,
    otp: '',
    isSending: false,
    isVerifying: false,
    error: null,
    resent: false,
    resendTimer: 0,
  });

  // Phone update OTP state
  const [phoneUpdateOtpModal, setPhoneUpdateOtpModal] = useState<{
    open: boolean;
    otp: string;
    isSending: boolean;
    isVerifying: boolean;
    error: string | null;
    resent: boolean;
    resendTimer: number;
    newPhone: string;
  }>({
    open: false,
    otp: '',
    isSending: false,
    isVerifying: false,
    error: null,
    resent: false,
    resendTimer: 0,
    newPhone: '',
  });

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
        const userData: UserResponse = await authAPI.getUser();

        setProfile({
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
          role: userData.role || 'Property Evaluation Specialist',
          email: userData.email || '',
          phone: userData.mobile_number || 'Not provided',
          avatar: '',
          emailVerified: userData.email_verified || false,
          phoneVerified: userData.phone_verified || false,
        });

        // Pre-fill edit form
        setEditForm({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          mobile_number: userData.mobile_number || '',
        });

        // 2. Fetch User Processes from API
        let processesData: ProcessSummaryResponse[] = [];
        try {
          processesData = await processAPI.getUserProcesses();
        } catch (e) {
          console.log('No processes found or error fetching processes');
          processesData = [];
        }

        // 3. Fetch User Properties to get property names
        let propertiesData: PropertyResponse[] = [];
        try {
          propertiesData = await propertyAPI.getUserProperties();
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

        // 5. Fetch Billing Status
        try {
          const billingData = await billingAPI.getStatus();
          setBillingStatus(billingData);
        } catch (e) {
          console.log('Error fetching billing status:', e);
        }

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
      const processesData = await processAPI.getUserProcesses();
      const propertiesData = await propertyAPI.getUserProperties();

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

  const handleUpgrade = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    setIsBillingLoading(true);
    try {
      const { checkout_url } = await billingAPI.createCheckoutSession();
      window.location.href = checkout_url;
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      alert('Failed to initiate upgrade. Please try again.');
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handleManageBilling = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    setIsBillingLoading(true);
    try {
      const { portal_url } = await billingAPI.getPortalLink();
      window.location.href = portal_url;
    } catch (err) {
      console.error('Failed to get portal link:', err);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    setSaveError(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSaveError(null);
  };

  const handleEditFormChange = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Check if phone number changed
      const originalPhone = profile.phone === 'Not provided' ? '' : profile.phone;
      const newPhone = editForm.mobile_number.trim();
      const phoneChanged = newPhone !== originalPhone;

      if (phoneChanged && newPhone) {
        // Close edit modal and open phone update OTP flow
        setIsEditModalOpen(false);
        setPhoneUpdateOtpModal({
          open: true,
          otp: '',
          isSending: true,
          isVerifying: false,
          error: null,
          resent: false,
          resendTimer: 0,
          newPhone,
        });

        // Request OTP for phone update
        try {
          await authAPI.requestPhoneUpdateOTP({ new_phone: newPhone, otp: '' });
          setPhoneUpdateOtpModal(prev => ({
            ...prev,
            isSending: false,
            resendTimer: 60,
          }));
        } catch (err) {
          setPhoneUpdateOtpModal(prev => ({
            ...prev,
            isSending: false,
            error: err instanceof Error ? err.message : 'Failed to send OTP',
          }));
        }
        setIsSaving(false);
        return;
      }

      // Build payload with only non-empty values (name changes only)
      const payload: UpdateUserRequest = {};
      if (editForm.first_name.trim()) payload.first_name = editForm.first_name.trim();
      if (editForm.last_name.trim()) payload.last_name = editForm.last_name.trim();

      const updatedUser = await authAPI.updateUser(payload);

      // Update local profile state
      setProfile(prev => ({
        ...prev,
        name: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim() || 'User',
      }));

      // Update localStorage name
      if (typeof window !== 'undefined') {
        localStorage.setItem('userName', `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim());
      }

      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Phone update OTP resend timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phoneUpdateOtpModal.resendTimer > 0) {
      interval = setInterval(() => {
        setPhoneUpdateOtpModal(prev => ({ ...prev, resendTimer: prev.resendTimer - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phoneUpdateOtpModal.resendTimer]);

  const closePhoneUpdateOtpModal = () => {
    setPhoneUpdateOtpModal({
      open: false,
      otp: '',
      isSending: false,
      isVerifying: false,
      error: null,
      resent: false,
      resendTimer: 0,
      newPhone: '',
    });
  };

  const handleResendPhoneUpdateOtp = async () => {
    if (phoneUpdateOtpModal.resendTimer > 0) return;

    setPhoneUpdateOtpModal(prev => ({ ...prev, isSending: true, error: null, resent: false }));

    try {
      await authAPI.requestPhoneUpdateOTP({ new_phone: phoneUpdateOtpModal.newPhone, otp: '' });
      setPhoneUpdateOtpModal(prev => ({
        ...prev,
        isSending: false,
        resent: true,
        resendTimer: 60,
      }));
    } catch (err) {
      setPhoneUpdateOtpModal(prev => ({
        ...prev,
        isSending: false,
        error: err instanceof Error ? err.message : 'Failed to resend OTP',
      }));
    }
  };

  const handleConfirmPhoneUpdate = async () => {
    if (phoneUpdateOtpModal.otp.length !== 6) return;

    setPhoneUpdateOtpModal(prev => ({ ...prev, isVerifying: true, error: null }));

    try {
      const result = await authAPI.confirmPhoneUpdate({
        new_phone: phoneUpdateOtpModal.newPhone,
        otp: phoneUpdateOtpModal.otp,
      });

      // Update profile with new phone
      setProfile(prev => ({
        ...prev,
        name: `${result.user.first_name || ''} ${result.user.last_name || ''}`.trim() || 'User',
        phone: result.user.mobile_number || 'Not provided',
        phoneVerified: result.user.phone_verified || false,
      }));

      // Update localStorage name
      if (typeof window !== 'undefined') {
        localStorage.setItem('userName', `${result.user.first_name || ''} ${result.user.last_name || ''}`.trim());
      }

      closePhoneUpdateOtpModal();
    } catch (err) {
      setPhoneUpdateOtpModal(prev => ({
        ...prev,
        isVerifying: false,
        error: err instanceof Error ? err.message : 'Failed to update phone number',
      }));
    }
  };

  // --- OTP Verification Logic ---

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpModal.resendTimer > 0) {
      interval = setInterval(() => {
        setOtpModal(prev => ({ ...prev, resendTimer: prev.resendTimer - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpModal.resendTimer]);

  const openOtpModal = async (type: 'email' | 'phone') => {
    setOtpModal({
      open: true,
      type,
      otp: '',
      isSending: true,
      isVerifying: false,
      error: null,
      resent: false,
      resendTimer: 0,
    });

    try {
      if (type === 'email') {
        await authAPI.sendEmailOTP();
      } else {
        await authAPI.sendPhoneOTP();
      }
      setOtpModal(prev => ({
        ...prev,
        isSending: false,
        resendTimer: 60,
      }));
    } catch (err) {
      setOtpModal(prev => ({
        ...prev,
        isSending: false,
        error: err instanceof Error ? err.message : `Failed to send ${type} verification code`,
      }));
    }
  };

  const closeOtpModal = () => {
    setOtpModal({
      open: false,
      type: null,
      otp: '',
      isSending: false,
      isVerifying: false,
      error: null,
      resent: false,
      resendTimer: 0,
    });
  };

  const handleResendOtp = async () => {
    if (otpModal.resendTimer > 0 || !otpModal.type) return;

    setOtpModal(prev => ({ ...prev, isSending: true, error: null, resent: false }));

    try {
      if (otpModal.type === 'email') {
        await authAPI.sendEmailOTP();
      } else {
        await authAPI.sendPhoneOTP();
      }
      setOtpModal(prev => ({
        ...prev,
        isSending: false,
        resent: true,
        resendTimer: 60,
      }));
    } catch (err) {
      setOtpModal(prev => ({
        ...prev,
        isSending: false,
        error: err instanceof Error ? err.message : 'Failed to resend code',
      }));
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpModal.type || otpModal.otp.length !== 6) return;

    setOtpModal(prev => ({ ...prev, isVerifying: true, error: null }));

    try {
      if (otpModal.type === 'email') {
        const result = await authAPI.verifyEmailOTP({ code: otpModal.otp });
        if (result.email_verified) {
          setProfile(prev => ({ ...prev, emailVerified: true }));
          closeOtpModal();
        } else {
          setOtpModal(prev => ({
            ...prev,
            isVerifying: false,
            error: result.message || 'Invalid verification code',
          }));
        }
      } else {
        const result = await authAPI.verifyPhoneOTP({ code: otpModal.otp });
        if (result.phone_verified) {
          setProfile(prev => ({ ...prev, phoneVerified: true }));
          closeOtpModal();
        } else {
          setOtpModal(prev => ({
            ...prev,
            isVerifying: false,
            error: result.message || 'Invalid verification code',
          }));
        }
      }
    } catch (err) {
      setOtpModal(prev => ({
        ...prev,
        isVerifying: false,
        error: err instanceof Error ? err.message : 'Verification failed',
      }));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <Button
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
              <div className="flex-1 flex flex-col gap-6">
                {/* Profile Info Container */}
                <Card className="p-5 md:p-8">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Profile Image */}
                    <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-200">
                        {profile.avatar && !imageError ? (
                          <Image
                            src={profile.avatar}
                            alt="Profile"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center text-3xl font-bold text-white">
                            {profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleOpenEditModal}
                        className="hidden sm:flex absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.name}</h2>
                      <p className="text-gray-500 mt-1">{profile.role}</p>

                      {/* Contact Grid */}
                      <div className="grid grid-cols-1 gap-4 mt-6">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">EMAIL</p>
                            {profile.emailVerified ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <CheckCircle size={12} />
                                Verified
                              </span>
                            ) : (
                              <button
                                onClick={() => openOtpModal('email')}
                                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                              >
                                <Mail size={12} />
                                Verify
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 mt-1 break-all">{profile.email}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">PHONE</p>
                            {profile.phoneVerified ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <CheckCircle size={12} />
                                Verified
                              </span>
                            ) : (
                              <button
                                onClick={() => openOtpModal('phone')}
                                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                              >
                                <Smartphone size={12} />
                                Verify
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 mt-1">{profile.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Audit History Container */}
                <Card className="p-5 md:p-8">
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

                          <StatusBadge status={audit.status} className="text-xs capitalize rounded-md px-3 py-1" />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Column */}
              <div className="w-full lg:w-[326px] flex flex-col gap-6">
                {/* Quick Stats Container */}
                <Card className="p-6">
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

                {/* Subscription & Billing Container */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Subscription</h2>
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>

                  {billingStatus?.has_subscription ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div>
                          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Plan</p>
                          <p className="text-lg font-bold text-emerald-900 mt-1">$49/month Pro Plan</p>
                        </div>
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                      </div>

                      <div className="space-y-3 px-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Status</span>
                          <span className="font-semibold text-emerald-600 capitalize">{billingStatus.subscription?.status}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Next Invoice</span>
                          <span className="font-semibold text-gray-900">
                            {billingStatus.subscription?.current_period_end
                              ? new Date(billingStatus.subscription.current_period_end).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleManageBilling}
                        disabled={isBillingLoading}
                        variant="outline"
                        className="w-full rounded-full h-11 flex items-center gap-2 group"
                      >
                        {isBillingLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Manage Billing
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Free Plan</p>
                        <p className="text-sm font-medium text-gray-600 mt-2">
                          Upgrade to Pro to unlock unlimited properties and advanced features.
                        </p>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="flex items-start gap-3 text-sm text-gray-600">
                          <Zap className="w-4 h-4 text-amber-500 mt-0.5" />
                          <span>Unlimited properties analyze</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-gray-600">
                          <Zap className="w-4 h-4 text-amber-500 mt-0.5" />
                          <span>Personalized negotiation messages</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-gray-600">
                          <Zap className="w-4 h-4 text-amber-500 mt-0.5" />
                          <span>Priority AI processing</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleUpgrade}
                        disabled={isBillingLoading}
                        className="w-full rounded-full h-11 font-bold shadow-md mt-2"
                      >
                        {isBillingLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                          </span>
                        ) : (
                          "Upgrade to Pro ($49/mo)"
                        )}
                      </Button>
                    </div>
                  )}
                </Card>


              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseEditModal}
          />

          {/* Modal Content */}
          <Card className="relative w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                <p className="text-sm text-gray-500 mt-1">Update your personal information</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseEditModal}
                className="rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6 text-gray-400 rotate-90 sm:rotate-0" />
              </Button>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {saveError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                <Input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                  placeholder="Enter first name"
                  className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                <Input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                  placeholder="Enter last name"
                  className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <Input
                  type="tel"
                  value={editForm.mobile_number}
                  onChange={(e) => handleEditFormChange('mobile_number', e.target.value)}
                  placeholder="Enter phone number"
                  className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <Button
                onClick={handleCloseEditModal}
                variant="outline"
                className="flex-1 rounded-full h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 rounded-full h-11"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* OTP Verification Modal */}
      {otpModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeOtpModal}
          />
          <Card className="relative w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Verify {otpModal.type === 'email' ? 'Email' : 'Phone Number'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter the 6-digit code sent to your {otpModal.type === 'email' ? 'email' : 'phone number'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeOtpModal}
                className="rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6 text-gray-400 rotate-90 sm:rotate-0" />
              </Button>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              {otpModal.isSending && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending verification code...
                </div>
              )}

              {!otpModal.isSending && otpModal.resent && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle size={16} />
                  A new code has been sent.
                </div>
              )}

              {!otpModal.isSending && otpModal.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <XCircle size={16} />
                  {otpModal.error}
                </div>
              )}

              {!otpModal.isSending && (
                <>
                  <OTPInput
                    value={otpModal.otp}
                    onChange={(val) => setOtpModal(prev => ({ ...prev, otp: val }))}
                    disabled={otpModal.isVerifying}
                  />

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpModal.resendTimer > 0 || otpModal.isVerifying}
                      className="text-sm text-primary font-medium hover:underline disabled:text-gray-400 disabled:no-underline"
                    >
                      {otpModal.resendTimer > 0
                        ? `Resend code in ${otpModal.resendTimer}s`
                        : 'Resend code'}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <Button
                onClick={closeOtpModal}
                variant="outline"
                className="flex-1 rounded-full h-11"
                disabled={otpModal.isVerifying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyOtp}
                disabled={otpModal.isVerifying || otpModal.otp.length !== 6 || otpModal.isSending}
                className="flex-1 rounded-full h-11"
              >
                {otpModal.isVerifying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Phone Update OTP Modal */}
      {phoneUpdateOtpModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closePhoneUpdateOtpModal}
          />
          <Card className="relative w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Update Phone Number</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter the 6-digit code sent to {phoneUpdateOtpModal.newPhone}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closePhoneUpdateOtpModal}
                className="rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6 text-gray-400 rotate-90 sm:rotate-0" />
              </Button>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              {phoneUpdateOtpModal.isSending && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending verification code...
                </div>
              )}

              {!phoneUpdateOtpModal.isSending && phoneUpdateOtpModal.resent && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle size={16} />
                  A new code has been sent.
                </div>
              )}

              {!phoneUpdateOtpModal.isSending && phoneUpdateOtpModal.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <XCircle size={16} />
                  {phoneUpdateOtpModal.error}
                </div>
              )}

              {!phoneUpdateOtpModal.isSending && (
                <>
                  <OTPInput
                    value={phoneUpdateOtpModal.otp}
                    onChange={(val) => setPhoneUpdateOtpModal(prev => ({ ...prev, otp: val }))}
                    disabled={phoneUpdateOtpModal.isVerifying}
                  />

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleResendPhoneUpdateOtp}
                      disabled={phoneUpdateOtpModal.resendTimer > 0 || phoneUpdateOtpModal.isVerifying}
                      className="text-sm text-primary font-medium hover:underline disabled:text-gray-400 disabled:no-underline"
                    >
                      {phoneUpdateOtpModal.resendTimer > 0
                        ? `Resend code in ${phoneUpdateOtpModal.resendTimer}s`
                        : 'Resend code'}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <Button
                onClick={closePhoneUpdateOtpModal}
                variant="outline"
                className="flex-1 rounded-full h-11"
                disabled={phoneUpdateOtpModal.isVerifying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPhoneUpdate}
                disabled={phoneUpdateOtpModal.isVerifying || phoneUpdateOtpModal.otp.length !== 6 || phoneUpdateOtpModal.isSending}
                className="flex-1 rounded-full h-11"
              >
                {phoneUpdateOtpModal.isVerifying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Confirm Update'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Audit History Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAuditModalOpen(false)}
          />

          {/* Modal Content */}
          <Card className="relative w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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

                    <StatusBadge status={audit.status} className="text-xs capitalize rounded-md px-3 py-1" />
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end sticky bottom-0">
              <Button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-8 rounded-full"
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
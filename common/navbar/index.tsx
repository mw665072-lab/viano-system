"use client";

import React, { useState, useEffect } from 'react';
import { Bell, User, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getStoredUserInfo, authAPI, getCurrentUserId } from '@/lib/api';

type NavbarProps = {
  onToggleSidebar?: () => void;
};

interface UserData {
  firstName: string;
  fullName: string;
  initials: string;
  profileImage?: string;
}

export default function WelcomeHeader({ onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    firstName: 'User',
    fullName: 'User',
    initials: 'U',
    profileImage: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // First, try to get stored user info from localStorage
        const storedInfo = getStoredUserInfo();

        if (storedInfo.name) {
          // Parse the stored name
          const nameParts = storedInfo.name.split(' ');
          const firstName = nameParts[0] || 'User';
          const initials = nameParts.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

          setUserData({
            firstName,
            fullName: storedInfo.name,
            initials,
            profileImage: undefined,
          });
        } else if (storedInfo.userId) {
          // If we have userId but not name, fetch from API
          try {
            const user = await authAPI.getUser(storedInfo.userId);
            const firstName = user.first_name || 'User';
            const lastName = user.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'User';
            const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U';

            // Store the name for future use
            if (typeof window !== 'undefined') {
              localStorage.setItem('userName', fullName);
            }

            setUserData({
              firstName,
              fullName,
              initials,
              profileImage: undefined,
            });
          } catch (err) {
            console.log('Could not fetch user data from API');
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const displayName = isLoading ? '...' : userData.firstName;
  const fullDisplayName = isLoading ? '...' : userData.fullName;

  return (
    <div className="w-full bg-white px-4 lg:px-0">
      <div className="max-w-full lg:w-[95%] py-4">
        {/* Mobile header with logo and menu */}
        <div className="flex lg:hidden items-center justify-between mb-4">
          <div className="font-montserrat font-bold text-[20px] leading-[21px] text-[#0C1D38]">
            viano systems®
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-10 w-10"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile welcome message + user section */}
        <div className="lg:hidden">
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-[20px] font-manrope font-semibold leading-[100%] text-[#0C1D38]">
              Welcome Back, {displayName}!
            </h1>
            <span className="text-xl">👋</span>
          </div>

          <div className="flex items-center justify-between">
            <Button
              onClick={() => {
                router.push('/profile')
              }}
              variant="ghost"
              className="flex items-center gap-2 px-3 py-2 h-auto rounded-lg"
            >
              <Avatar className="h-8 w-8 bg-blue-100">
                {userData.profileImage ? (
                  <AvatarImage src={userData.profileImage} alt={userData.fullName} />
                ) : null}
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {userData.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 items-start">
                <span className="text-[14px] font-inter font-semibold leading-[100%] text-[#0C1D38]">{fullDisplayName}</span>
                <span className="text-[12px] font-inter font-medium leading-[100%] text-[#0C1D38]">View Profile</span>
              </div>
            </Button>

            <Button
              onClick={() => {
                router.push('/notifications')
              }}
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-lg hover:bg-gray-100"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
          </div>
        </div>

        {/* Desktop layout - hidden on mobile */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-manrope font-semibold leading-[100%] text-[#0C1D38]">
                Welcome Back, {displayName}!
              </h1>
              <span className="text-2xl">👋</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                router.push("/profile")
              }}
              variant="ghost"
              className="flex items-center gap-2 px-3 py-2 h-auto rounded-lg"
            >
              <Avatar className="h-8 w-8 bg-blue-100">
                {userData.profileImage ? (
                  <AvatarImage src={userData.profileImage} alt={userData.fullName} />
                ) : null}
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {userData.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 items-start">
                <span className="text-[14px] font-inter font-semibold leading-[100%] text-[#0C1D38]">{fullDisplayName}</span>
                <span className="text-[12px] font-inter font-medium leading-[100%] text-[#0C1D38]">View Profile</span>
              </div>
            </Button>

            <Button
              onClick={() => {
                router.push('/notifications')
              }}
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-lg hover:bg-gray-100"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

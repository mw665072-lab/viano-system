"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getStoredUserInfo, authAPI } from '@/lib/api';
import Image from 'next/image';

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
    <div className="w-full bg-white">
      {/* Mobile header with logo and menu */}
      <div className="flex lg:hidden items-center justify-between px-4 py-3 border-b border-gray-100">
        <Image
          src="/Logo Web.svg"
          alt="Viano Systems"
          width={100}
          height={32}
          priority
          className="h-8 w-auto"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Header Content */}
      <div className="px-4 lg:px-6 py-4">
        {/* Mobile welcome + profile section */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[#0C1D38]">
                Welcome Back, {displayName}!
              </h1>
              <span className="text-lg">👋</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push('/profile')}
                variant="ghost"
                className="flex items-center gap-2 px-2 py-1.5 h-auto rounded-full hover:bg-gray-50"
              >
                <Avatar className="h-8 w-8 border border-gray-200">
                  {userData.profileImage ? (
                    <AvatarImage src={userData.profileImage} alt={userData.fullName} />
                  ) : null}
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                    {userData.initials}
                  </AvatarFallback>
                </Avatar>
              </Button>

              <Button
                onClick={() => router.push('/notifications')}
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full hover:bg-gray-50"
              >
                <Bell className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#0C1D38]">
              Welcome Back, {displayName}!
            </h1>
            <span className="text-xl">👋</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/profile')}
              variant="ghost"
              className="flex items-center gap-3 px-3 py-2 h-auto rounded-full hover:bg-gray-50 transition-colors"
            >
              <Avatar className="h-9 w-9 border border-gray-200">
                {userData.profileImage ? (
                  <AvatarImage src={userData.profileImage} alt={userData.fullName} />
                ) : null}
                <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
                  {userData.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-[#0C1D38] leading-tight">{fullDisplayName}</span>
                <span className="text-xs text-[#6B7280] leading-tight">View Profile</span>
              </div>
            </Button>

            <Button
              onClick={() => router.push('/notifications')}
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full hover:bg-gray-50 border border-gray-200"
            >
              <Bell className="h-5 w-5 text-[#FFC107]" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

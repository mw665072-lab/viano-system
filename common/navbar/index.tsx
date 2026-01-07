import React from 'react';
import { Bell, User, Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

type NavbarProps = {
  onToggleSidebar?: () => void;
};

export default function WelcomeHeader({ onToggleSidebar }: NavbarProps) {
  const router = useRouter();
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
              Welcome Back, Leslie!
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
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 items-start">
                <span className="text-[14px] font-inter font-semibold leading-[100%] text-[#0C1D38]">Leslie John</span>
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
                Welcome Back, Leslie!
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
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 items-start">
                <span className="text-[14px] font-inter font-semibold leading-[100%] text-[#0C1D38]">Leslie John</span>
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
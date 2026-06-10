"use client";
import { Home, Building2, User, LogOut, Shield, Lock, LayoutDashboard } from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';
import { clearAuth, getStoredUserInfo } from '@/lib/api';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('Chris Evans');
  const [userRole, setUserRole] = useState('Real Estate Agent');
  const [userInitials, setUserInitials] = useState('CE');

  useEffect(() => {
    const userInfo = getStoredUserInfo();
    if (userInfo.name) {
      setUserName(userInfo.name);
      const parts = userInfo.name.split(' ').filter(Boolean);
      const initials = parts.length > 1 
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0]?.slice(0, 2).toUpperCase() || 'CE';
      setUserInitials(initials);
    }
  }, []);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "properties", label: "Manage Properties", icon: Building2, href: "/manage-properties" },
    { id: "shield", label: "Shield", icon: Shield, href: "/shield", badge: "BETA" },
    { id: "contractors", label: "Contractors", icon: Lock, href: "/contractors", locked: true },
  ];

  const bottomItems = [
    { id: "profile", label: "Profile", icon: User, href: "/profile" },
  ];

  const getActiveId = () => {
    if (pathname === '/dashboard' || pathname === '/') return 'dashboard';
    if (pathname.startsWith('/manage-properties') || pathname.startsWith('/add-properties')) return 'properties';
    if (pathname.startsWith('/shield')) return 'shield';
    if (pathname.startsWith('/contractors')) return 'contractors';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'dashboard';
  };

  const activeItem = getActiveId();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="w-[260px] h-screen bg-[#0a0a0a] flex flex-col text-white">
      {/* Logo */}
      <div className="py-5 px-5 flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2L2 8L14 14L26 8L14 2Z" fill="#F97316" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 20L14 26L26 20" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 14L14 20L26 14" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xl font-bold">viano</span>
      </div>

      {/* Main Nav */}
      <div className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!item.locked) {
                    router.push(item.href);
                    onClose?.();
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-orange-400"
                    : item.locked
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white">
                    {item.badge}
                  </span>
                )}
                {item.locked && (
                  <Lock size={14} className="text-gray-600" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Plan Cards */}
        <div className="mt-8 space-y-3">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-sm font-semibold text-white">Core Plan</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Up to 15 properties</p>
            <p className="text-sm font-bold text-white mb-3">$50 / month</p>
            <button className="w-full py-2 rounded-lg bg-white/10 text-xs font-medium text-white hover:bg-white/20 transition-colors">
              Upgrade to Core
            </button>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-sm font-semibold text-white">Pro Plan</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Up to 3 properties</p>
            <p className="text-sm font-bold text-white mb-3">$15 / month</p>
            <button className="w-full py-2 rounded-lg bg-white/10 text-xs font-medium text-white hover:bg-white/20 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-3 pb-4">
        {/* Profile Nav */}
        <nav className="mb-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  router.push(item.href);
                  onClose?.();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Log Out */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#FF2D55] hover:bg-white/5 transition-colors"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>

        {/* User Profile */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-gray-500">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

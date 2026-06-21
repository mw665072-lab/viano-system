"use client";
import { Home, Building2, User, LogOut, Shield, Lock, LayoutDashboard } from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';
import { clearAuth, getStoredUserInfo } from '@/lib/api';
import { ThemeToggle } from '@/common/theme/theme-toggle';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('Chris Evans');
  const [userRole, setUserRole] = useState('Real Estate Agent');
  const [userInitials, setUserInitials] = useState('CE');
  const [menuOpen, setMenuOpen] = useState(false);

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

  const getActiveId = () => {
    if (pathname === '/dashboard' || pathname === '/') return 'dashboard';
    if (pathname.startsWith('/manage-properties') || pathname.startsWith('/add-properties')) return 'properties';
    if (pathname.startsWith('/shield')) return 'shield';
    if (pathname.startsWith('/contractors')) return 'contractors';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'dashboard';
  };

  const activeItem = getActiveId();

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const openMenu = () => {
    cancelClose();
    setMenuOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setMenuOpen(false), 150);
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="w-[260px] h-screen bg-[#1F1F1F] flex flex-col text-white">
      {/* Logo */}
      <div className="py-5 px-5 flex items-center gap-2">
        <Image
          src="/Logo.svg"
          alt="Viano Systems"
          width={28}
          height={23}
          priority
          className="h-[50px] w-auto"
        />
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
                    ? "bg-white/10 text-[#E8730A]"
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8730A" strokeWidth="2">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8730A" strokeWidth="2">
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

      {/* Bottom Section - Profile card (hover or click to reveal menu) */}
      <div className="px-3 pb-4">
        {/* Theme toggle */}
        <div className="flex items-center justify-between px-2 mb-3">
          <span className="text-xs font-medium text-gray-400">Theme</span>
          <ThemeToggle variant="dark" className="w-9 h-9" />
        </div>

        <div
          className="relative"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          {/* Account menu - above the card, full card width, dark themed */}
          {menuOpen && (
            <div
              onMouseEnter={openMenu}
              onMouseLeave={scheduleClose}
              className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-xl bg-[#2A2A2A] border border-white/10 shadow-xl p-1.5"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/profile');
                  onClose?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-white/10 transition-colors"
              >
                <User size={16} />
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          )}

          {/* Profile card - the trigger */}
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className={`w-full flex items-center gap-3 rounded-xl border border-white/10 p-3 text-left transition-colors ${menuOpen ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'}`}
          >
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-300 flex-shrink-0">
              <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-gray-400 truncate">{userRole}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

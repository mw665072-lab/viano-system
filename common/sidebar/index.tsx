"use client";
import { Home, Building2, User, LogOut } from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';
import { clearAuth } from '@/lib/api';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      id: "dashboard", label: "Dashboard", icon: Home,
      href: "/dashboard"
    },
    { id: "properties", label: "Manage Properties", icon: Building2, href: "/manage-properties" },
    { id: "profile", label: "Profile", icon: User, href: "/profile" },
  ];

  // Determine which menu item is active based on current pathname
  const getActiveId = () => {
    if (pathname === '/dashboard' || pathname === '/') return 'dashboard';
    if (pathname.startsWith('/manage-properties') || pathname.startsWith('/add-properties')) return 'properties';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'dashboard';
  };

  const activeItem = getActiveId();

  const handleLogout = () => {
    // Clear all auth data from localStorage
    clearAuth();
    // Redirect to login page
    router.push('/login');
  };

  return (
    <div className="w-[250px] h-screen bg-white flex flex-col transition-width duration-200">
      <div className="p-6" >
        <div className="font-montserrat font-bold py-2 text-[24px] leading-[21px] tracking-[0%] text-center text-[#0C1D38]">
          {"viano systems®"}
        </div>
      </div>

      <div className="flex-1 pl-6 pr-4 py-4 flex flex-col justify-between rotate-0 opacity-100">
        <div>
          <p className="font-roboto font-medium text-[12px] leading-[100%] tracking-[0%] uppercase text-[#1E1E1E] mb-6">
            Navigate
          </p>
          <nav className="space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className={`w-[209px] h-[40px] flex items-center gap-[10px] px-4 py-2 rounded-[12px] text-sm font-medium transition-colors rotate-0 opacity-100 ${isActive
                    ? "bg-[#D8E6FD] text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="h-[68px] border-t border-[#D9D9D9] flex items-center justify-start gap-[10px] rotate-0 opacity-100">
          <button
            type="button"
            onClick={handleLogout}
            className="w-[209px] h-[40px] flex items-center justify-start gap-[10px] px-4 py-2 rounded-[12px] text-[14px] font-normal leading-[100%] capitalize text-[#FF2D55] hover:bg-red-50 transition-colors rotate-0 opacity-100"
          >
            <LogOut size={16} className="text-[#FF2D55]" />
            <span className="font-inter">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

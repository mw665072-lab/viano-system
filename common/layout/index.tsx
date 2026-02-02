"use client";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState, useEffect } from "react";
import Navbar from "../navbar";
import Sidebar from "../sidebar";
import { PageHeader } from "../header";
import { getStoredUserInfo } from "@/lib/api";


interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Get user name for welcome message
    useEffect(() => {
        const userInfo = getStoredUserInfo();
        if (userInfo.name) {
            // Extract first name from full name
            const firstName = userInfo.name.split(' ')[0];
            setUserName(firstName);
        }
    }, []);

    // Auth and landing pages should bypass the sidebar/navbar layout
    const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/" || pathname === "/landing-page";

    if (isAuthPage) {
        return <>{children}</>;
    }

    const handleAddProperty = () => {
        // Add your property creation logic here
        console.log("Add new property clicked");
    };

    const handleMarkAll = () => {
        // Logic to mark all notifications as read
        console.log("Mark all as read clicked");
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - hidden on mobile */}
                <div className="hidden lg:block">
                    <Sidebar />
                </div>

                {/* Mobile sidebar overlay */}
                {isSidebarOpen && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
                            <Sidebar onClose={() => setIsSidebarOpen(false)} />
                        </div>
                    </>
                )}

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Dashboard - Welcome message, no back button */}
                    {pathname === "/dashboard" ? (
                        <PageHeader
                            title={userName ? `Welcome Back, ${userName}!` : "Welcome Back!"}
                            showBack={false}
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                            showProfileSection={true}
                        />
                    ) : pathname === "/" ? (
                        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                    ) : pathname === "/profile" || pathname?.startsWith("/profile/") ? (
                        <PageHeader
                            title="Profile"
                            showBack={true}
                            onBack={() => router.back()}
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        />
                    ) : pathname === "/notifications" || pathname?.startsWith("/notifications/") ? (
                        <PageHeader
                            title="Notifications"
                            showBack={true}
                            onBack={() => router.back()}
                            actionLabel="Mark All as Read"
                            onAction={handleMarkAll}
                            actionIcon={null}
                            actionVariant="secondary"
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        />
                    ) : pathname === "/manage-properties/add-properties" ? (
                        <PageHeader
                            title="Add Property"
                            showBack={true}
                            backHref="/manage-properties"
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        />
                    ) : pathname === "/manage-properties" || pathname?.startsWith("/manage-properties") ? (
                        <PageHeader
                            title="Manage Properties"
                            showBack={false}
                            actionLabel="Add New Property"
                            actionHref="/manage-properties/add-properties"
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        />
                    ) : (
                        <PageHeader
                            title="Viano Systems"
                            showBack={true}
                            onBack={() => router.back()}
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        />
                    )}
                    <main className="flex-1 p-4 lg:p-6 overflow-auto rotate-0 opacity-100 rounded-tl-[32px] bg-[#EFF6FF]">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Layout;


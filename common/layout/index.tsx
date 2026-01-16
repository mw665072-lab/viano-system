"use client";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import Navbar from "../navbar";
import Sidebar from "../sidebar";
import { PageHeader } from "../header";


interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Auth and landing pages should bypass the sidebar/navbar layout
    const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/landing";

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
                            <Sidebar />
                        </div>
                    </>
                )}

                <div className="flex-1 flex flex-col overflow-hidden">
                    {pathname === "/" ? (
                        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                    ) : pathname === "/profile" || pathname?.startsWith("/profile/") ? (
                        <PageHeader
                            title="Profile"
                            showBack={true}
                            onBack={() => router.back()}
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
                        />
                    ) : pathname === "/manage-properties/add-properties" ? (
                        <PageHeader
                            title="Manage Properties"
                            showBack={true}
                            backHref="/manage-properties"
                        />
                    ) : (
                        <PageHeader
                            title="Manage Properties"
                            showBack={true}
                            onBack={() => router.back()}
                            actionLabel="Add New Property"
                            actionHref="/manage-properties/add-properties"
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


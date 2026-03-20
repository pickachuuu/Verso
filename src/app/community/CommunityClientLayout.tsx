'use client';

import LandingNavbar from "@/component/Layout/navbar/LandingNavbar";
import Navbar from "@/component/Layout/navbar/navbar";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores";

export default function CommunityClientLayout({
    children,
    isAuthenticated
}: {
    children: React.ReactNode;
    isAuthenticated: boolean;
}) {
    const pathname = usePathname();
    const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
    const toggleSidebar = useUIStore((state) => state.toggleSidebar);

    useEffect(() => {
        document.body.style.overflow = '';
    }, [pathname]);

    if (isAuthenticated) {
        return (
            <div className="flex min-h-screen w-full overflow-x-hidden">
                <Navbar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
                <main className={`flex-1 min-w-0 dashboard-grid-bg min-h-screen transition-all duration-300 ease-in-out ${
                    sidebarCollapsed ? 'md:ml-[5rem]' : 'md:ml-[18rem]'
                }`}>
                    <div className="relative z-10 px-2 sm:px-4 lg:px-6 pt-24 md:pt-6 pb-20 md:pb-6 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen min-w-0">
            <LandingNavbar variant="normal" />
            <main className="dashboard-grid-bg min-h-screen pt-20 pb-12">
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

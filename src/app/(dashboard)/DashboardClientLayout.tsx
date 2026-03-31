'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/component/Layout/navbar/navbar";
import LandingNavbar from "@/component/Layout/navbar/LandingNavbar";
import { useUIStore } from "@/stores";

interface DashboardClientLayoutProps {
    children: React.ReactNode;
    isAuthenticated: boolean;
}

export default function DashboardClientLayout({ children, isAuthenticated }: DashboardClientLayoutProps) {
    const pathname = usePathname();
    const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
    const toggleSidebar = useUIStore((state) => state.toggleSidebar);

    // Safety: ensure body scroll is never stuck hidden after page navigation
    useEffect(() => {
        document.body.style.overflow = '';
    }, [pathname]);

    const isStudyMode = pathname?.includes('/study');

    if (!isAuthenticated && pathname === '/community') {
        return (
            <div className="min-h-screen min-w-0">
                <LandingNavbar />
                <main className="dashboard-grid-bg min-h-screen pt-20 pb-12">
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full overflow-x-hidden">
            {!isStudyMode && <Navbar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />}
            <main className={`flex-1 min-w-0 dashboard-grid-bg min-h-screen transition-all duration-300 ease-in-out ${!isStudyMode
                    ? (sidebarCollapsed ? 'md:ml-[5rem]' : 'md:ml-[20rem]')
                    : 'md:ml-0'
                }`}>
                <div className={`relative z-10 px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto w-full transition-all ${isStudyMode ? 'pt-0 pb-0' : 'pt-16 pb-20 md:py-6'
                    }`}>
                    {children}
                </div>
            </main>
        </div>
    );
}

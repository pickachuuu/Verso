'use client';

import LandingNavbar from "@/component/Layout/navbar/LandingNavbar";
import Navbar from "@/component/Layout/navbar/navbar";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function CommunityClientLayout({
    children,
    isAuthenticated
}: {
    children: React.ReactNode;
    isAuthenticated: boolean;
}) {
    const pathname = usePathname();

    useEffect(() => {
        document.body.style.overflow = '';
    }, [pathname]);

    if (isAuthenticated) {
        return (
            <div className="flex min-h-screen w-full overflow-x-hidden">
                <Navbar />
                <main className="flex-1 md:ml-60 paper-bg pt-16 md:pt-0 min-w-0">
                    <div className="px-2 sm:px-4 lg:px-6 py-6 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <LandingNavbar variant="normal" />
            <main className="pt-20 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

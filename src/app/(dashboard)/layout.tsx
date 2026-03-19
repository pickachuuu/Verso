'use client';

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/component/Layout/navbar/navbar";

const SIDEBAR_STORAGE_KEY = 'verso-sidebar-collapsed';

export default function DashboardLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Safety: ensure body scroll is never stuck hidden after page navigation
  useEffect(() => {
    document.body.style.overflow = '';
  }, [pathname]);

  // Read initial sidebar state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === 'true') setSidebarCollapsed(true);
    } catch {}
  }, []);

  // Listen for sidebar toggle events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.collapsed === 'boolean') {
        setSidebarCollapsed(detail.collapsed);
      }
    };
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  const isStudyMode = pathname?.includes('/study');

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      {!isStudyMode && <Navbar />}
      <main className={`flex-1 min-w-0 dashboard-grid-bg min-h-screen transition-all duration-300 ease-in-out ${
        !isStudyMode
          ? sidebarCollapsed ? 'md:ml-[5rem]' : 'md:ml-[18rem]'
          : 'md:ml-0'
      }`}>
        <div className={`relative z-10 px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto w-full transition-all ${
          isStudyMode ? 'pt-0 pb-0' : 'pt-24 pb-20 md:py-6'
        }`}>
          {children}
        </div>
      </main>
    </div>
  );
}

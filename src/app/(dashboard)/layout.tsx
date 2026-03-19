'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/component/Layout/navbar/navbar";

export default function DashboardLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Safety: ensure body scroll is never stuck hidden after page navigation
  useEffect(() => {
    document.body.style.overflow = '';
  }, [pathname]);

  const isStudyMode = pathname?.includes('/study');

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      {!isStudyMode && <Navbar />}
      <main className={`flex-1 min-w-0 dashboard-grid-bg min-h-screen transition-all ${!isStudyMode ? 'md:ml-60' : 'md:ml-0'}`}>
        <div className={`relative z-10 px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto w-full transition-all ${
          isStudyMode ? 'pt-0 pb-0' : 'pt-24 pb-20 md:py-6'
        }`}>
          {children}
        </div>
      </main>
    </div>
  );
}


'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/component/Layout/navbar/navbar";
import SyncStatus from "@/component/ui/SyncStatus";

export default function DashboardLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Safety: ensure body scroll is never stuck hidden after page navigation
  useEffect(() => {
    document.body.style.overflow = '';
  }, [pathname]);

  return (
    <div className="flex">
      <Navbar />
      <main className="flex-1 md:ml-60 paper-bg pt-16 md:pt-0">
        <div className="px-2 sm:px-4 lg:px-6 py-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <SyncStatus />
    </div>
  );
}


'use client';

import Navbar from "@/component/Layout/navbar/navbar";

export default function DashboardLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen memoforge-bg">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl main-content relative z-10">
        {children}
      </main>
    </div>
  );
}
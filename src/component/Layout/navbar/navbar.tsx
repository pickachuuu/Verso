'use client';

import { navItems } from "./navConfig";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logout01Icon, Menu01Icon, Cancel01Icon, DashboardSpeed01Icon } from "hugeicons-react";
import { useState } from "react";
import { signOut } from '@/hook/useAuthActions';
import { NotebookIcon, FlashcardIcon, ExamIcon } from '@/component/icons';

const getNavIcon = (href: string) => {
  switch (href) {
    case '/dashboard': return <DashboardSpeed01Icon className="w-5 h-5" />;
    case '/library': return <NotebookIcon className="w-5 h-5" />;
    case '/flashcards': return <FlashcardIcon className="w-5 h-5" />;
    case '/exams': return <ExamIcon className="w-5 h-5" />;
    default: return null;
  }
};

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* ═══════════════ Desktop Sidebar ═══════════════ */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 z-50 flex-col"
        style={{
          background: 'linear-gradient(180deg, #0D1A3A 0%, #091228 100%)',
          boxShadow: [
            '4px 0 24px rgba(0, 0, 0, 0.35)',
            '1px 0 0 rgba(255, 255, 255, 0.04)',
            'inset -1px 0 0 rgba(255, 255, 255, 0.06)',
          ].join(', '),
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
              style={{
                background: 'linear-gradient(145deg, var(--primary-light) 0%, var(--primary) 60%, var(--primary-dark) 100%)',
                boxShadow: [
                  '0 6px 16px -2px rgba(40, 69, 214, 0.55)',
                  '0 2px 4px rgba(0, 0, 0, 0.25)',
                  'inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                  'inset 0 -1px 2px rgba(0, 0, 0, 0.2)',
                ].join(', '),
              }}
            >
              <span className="text-white font-bold text-lg" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>M</span>
            </div>
            <span className="text-xl font-bold text-white/90 group-hover:text-white transition-colors tracking-tight">
              MemoForge
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={isActive ? {
                  background: 'linear-gradient(145deg, rgba(40, 69, 214, 0.35) 0%, rgba(40, 69, 214, 0.15) 100%)',
                  color: '#ffffff',
                  boxShadow: [
                    '0 4px 12px -2px rgba(40, 69, 214, 0.3)',
                    'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    'inset 0 -1px 2px rgba(0, 0, 0, 0.1)',
                  ].join(', '),
                  border: '1px solid rgba(40, 69, 214, 0.25)',
                } : {
                  color: 'rgba(255, 255, 255, 0.45)',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)';
                  }
                }}
              >
                {getNavIcon(item.href)}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="px-3 pb-6 mt-auto">
          <div
            className="h-px mx-3 mb-4"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
          />
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ color: 'rgba(255, 255, 255, 0.35)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#F87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.35)';
            }}
          >
            <Logout01Icon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════════ Mobile Top Bar ═══════════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div
          className="px-4 py-3"
          style={{
            background: 'linear-gradient(180deg, rgba(13, 26, 58, 0.98) 0%, rgba(13, 26, 58, 0.95) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, var(--primary-light) 0%, var(--primary) 100%)',
                  boxShadow: '0 4px 12px rgba(40, 69, 214, 0.45)',
                }}
              >
                <span className="text-white font-bold text-base">M</span>
              </div>
              <span className="text-lg font-bold text-white/90">MemoForge</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl transition-colors"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              {mobileMenuOpen ? <Cancel01Icon className="w-5 h-5" /> : <Menu01Icon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div
            className="px-4 pb-4"
            style={{
              background: 'rgba(13, 26, 58, 0.98)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <nav className="space-y-1 pt-2">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={isActive ? {
                      background: 'linear-gradient(145deg, rgba(40, 69, 214, 0.35) 0%, rgba(40, 69, 214, 0.15) 100%)',
                      color: '#ffffff',
                    } : {
                      color: 'rgba(255, 255, 255, 0.45)',
                    }}
                  >
                    {getNavIcon(item.href)}
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}

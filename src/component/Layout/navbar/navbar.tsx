'use client';

import { navItems } from "./navConfig";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logout01Icon, Menu01Icon, Cancel01Icon, DashboardSpeed01Icon, Notification03Icon, Bookmark01Icon } from "hugeicons-react";
import { useEffect, useRef, useState } from "react";
import { signOut } from '@/hook/useAuthActions';
import { NotebookIcon, FlashcardIcon, ExamIcon } from '@/component/icons';

const getNavIcon = (href: string) => {
  switch (href) {
    case '/dashboard': return <DashboardSpeed01Icon className="w-6 h-6" />;
    case '/library': return <NotebookIcon className="w-6 h-6" />;
    case '/flashcards': return <FlashcardIcon className="w-6 h-6" />;
    case '/exams': return <ExamIcon className="w-6 h-6" />;
    default: return null;
  }
};

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const secondaryItems = [
    { name: 'Saved Materials', href: '/saved', icon: <Bookmark01Icon className="w-6 h-6" /> },
  ];
  const notifications = [] as { id: string; title: string; detail: string }[];

  useEffect(() => {
    if (!mobileMenuOpen) {
      setNotificationsOpen(false);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* ═══════════════ Desktop Sidebar ═══════════════ */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 z-50 flex-col bg-surface border-r border-border shadow-[4px_0_24px_rgba(60,50,40,0.08)]">
        {/* Logo */}
        <div className="px-5 pt-6 pb-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform bg-background-muted border border-border shadow-sm"
            >
              <span className="text-primary font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-foreground group-hover:text-foreground transition-colors tracking-tight">
              MemoForge
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 border ${
                  isActive
                    ? "bg-background-muted text-foreground border-pencil/40 shadow-sm relative after:content-[''] after:absolute after:left-4 after:right-4 after:bottom-2 after:h-[2px] after:bg-pencil/50 after:rounded-full"
                    : 'text-foreground-muted border-transparent hover:bg-background-muted hover:text-foreground hover:border-border'
                }`}
              >
                {getNavIcon(item.href)}
                {item.name}
              </Link>
            );
          })}

          <div className="my-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {secondaryItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 border ${
                  isActive
                    ? "bg-background-muted text-foreground border-pencil/40 shadow-sm relative after:content-[''] after:absolute after:left-4 after:right-4 after:bottom-2 after:h-[2px] after:bg-pencil/50 after:rounded-full"
                    : 'text-foreground-muted border-transparent hover:bg-background-muted hover:text-foreground hover:border-border'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}

          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 border ${
                notificationsOpen
                  ? 'bg-background-muted text-foreground border-pencil/40 shadow-sm'
                  : 'text-foreground-muted border-transparent hover:bg-background-muted hover:text-foreground hover:border-border'
              }`}
            >
              <Notification03Icon className="w-6 h-6" />
              Notifications
            </button>

            {notificationsOpen && (
              <div className="absolute left-full top-0 ml-3 w-72 z-50">
                <div className="rounded-2xl bg-surface border border-dashed border-pencil/40 shadow-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    <span className="text-xs text-foreground-muted">
                      {notifications.length === 0 ? 'No new' : `${notifications.length} new`}
                    </span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-xs text-foreground-muted bg-background-muted border border-border rounded-xl px-3 py-3 text-center">
                      You&apos;re all caught up.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((note) => (
                        <div key={note.id} className="rounded-xl border border-border bg-background-muted px-3 py-2">
                          <p className="text-xs font-semibold text-foreground">{note.title}</p>
                          <p className="text-[11px] text-foreground-muted">{note.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Sign Out */}
        <div className="px-3 pb-6 mt-auto">
          <div className="h-px mx-3 mb-4 bg-gradient-to-r from-transparent via-border to-transparent" />
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-foreground-muted hover:text-error hover:bg-error/10"
          >
            <Logout01Icon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════════ Mobile Top Bar ═══════════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="px-4 py-3 bg-surface/95 backdrop-blur-md border-b border-border shadow-sm">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-background-muted border border-border shadow-sm"
              >
                <span className="text-primary font-bold text-base">M</span>
              </div>
              <span className="text-lg font-bold text-foreground">MemoForge</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl transition-colors text-foreground-muted hover:text-foreground hover:bg-background-muted"
            >
              {mobileMenuOpen ? <Cancel01Icon className="w-5 h-5" /> : <Menu01Icon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="px-4 pb-4 bg-surface border-t border-border shadow-md">
            <nav className="space-y-1 pt-2">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                      isActive
                        ? 'bg-background-muted text-foreground border-pencil/40 shadow-sm'
                        : 'text-foreground-muted border-transparent hover:bg-background-muted hover:text-foreground hover:border-border'
                    }`}
                  >
                    {getNavIcon(item.href)}
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="my-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="space-y-1">
              {secondaryItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                      isActive
                        ? 'bg-background-muted text-foreground border-pencil/40 shadow-sm'
                        : 'text-foreground-muted border-transparent hover:bg-background-muted hover:text-foreground hover:border-border'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  notificationsOpen
                    ? 'bg-background-muted text-foreground border-pencil/40 shadow-sm'
                    : 'text-foreground-muted border-transparent hover:bg-background-muted hover:text-foreground hover:border-border'
                }`}
              >
                <Notification03Icon className="w-5 h-5" />
                Notifications
              </button>

              {notificationsOpen && (
                <div className="rounded-2xl bg-surface border border-dashed border-pencil/40 shadow-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">Notifications</span>
                    <span className="text-[10px] text-foreground-muted">
                      {notifications.length === 0 ? 'No new' : `${notifications.length} new`}
                    </span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-[11px] text-foreground-muted bg-background-muted border border-border rounded-xl px-3 py-2 text-center">
                      You&apos;re all caught up.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((note) => (
                        <div key={note.id} className="rounded-xl border border-border bg-background-muted px-3 py-2">
                          <p className="text-[11px] font-semibold text-foreground">{note.title}</p>
                          <p className="text-[10px] text-foreground-muted">{note.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

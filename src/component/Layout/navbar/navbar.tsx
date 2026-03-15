'use client';

import { navItems } from "./navConfig";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Logout01Icon, Menu01Icon, Cancel01Icon } from "hugeicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUserProfile } from '@/hooks/useAuth';
import { NotebookIcon, FlashcardIcon, ExamIcon, DashboardIcon, SavedIcon, CommunityIcon, NotificationIcon } from '@/component/icons';
import { useCardsDue, useClearNotifications, useNotificationDismissals, useStudyStreak } from '@/hooks';
import SignOutModal from '@/component/ui/SignOutModal';

const getNavIcon = (href: string) => {
  switch (href) {
    case '/dashboard': return <DashboardIcon className="w-6 h-6" />;
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
  const { data: userProfile } = useUserProfile();
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  const avatarLabelSource = (userProfile?.full_name || userProfile?.email || '').trim();
  const avatarFallback = (() => {
    if (!avatarLabelSource) return 'U';
    if (avatarLabelSource.includes('@')) return avatarLabelSource[0]?.toUpperCase() || 'U';
    const parts = avatarLabelSource.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  })();

  const secondaryItems = [
    { name: 'Saved Materials', href: '/saved', icon: <SavedIcon className="w-6 h-6" /> },
    { name: 'Community', href: '/community', icon: <CommunityIcon className="w-6 h-6" /> },
  ];
  const { data: cardsDue, isLoading: cardsDueLoading } = useCardsDue();
  const { data: streakData, isLoading: streakLoading } = useStudyStreak();
  const { data: dismissals = [], isLoading: dismissalsLoading } = useNotificationDismissals();
  const clearNotifications = useClearNotifications();

  const dismissedToday = useMemo(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    const set = new Set<string>();
    dismissals.forEach((dismissal) => {
      if (dismissal.dismissed_on === todayKey) {
        set.add(dismissal.notification_key);
      }
    });
    return set;
  }, [dismissals]);

  const notifications = useMemo(() => {
    const items: { id: string; title: string; detail: string }[] = [];
    const dueToday = cardsDue?.dueToday ?? 0;
    if (!cardsDueLoading && dueToday > 0) {
      items.push({
        id: 'due-cards',
        title: 'Due cards today',
        detail: `You have ${dueToday} card${dueToday === 1 ? '' : 's'} due today.`,
      });
    }

    if (!streakLoading && streakData?.studiedToday) {
      items.push({
        id: 'streak',
        title: 'Streak preserved',
        detail: 'Streak preserved—1 day left to keep it going.',
      });
    }

    return items.filter((item) => !dismissedToday.has(item.id));
  }, [cardsDue, cardsDueLoading, dismissedToday, streakData, streakLoading]);

  const hasNotifications = notifications.length > 0;
  const isLoadingNotifications = cardsDueLoading || streakLoading || dismissalsLoading;
  const notificationStatusLabel = isLoadingNotifications
    ? 'Checking...'
    : hasNotifications ? `${notifications.length} new` : 'No new';

  const handleClearNotifications = () => {
    if (!hasNotifications || clearNotifications.isPending) return;
    clearNotifications.mutate(notifications.map((note) => note.id));
  };

  const handleOpenSignOut = () => {
    setNotificationsOpen(false);
    setMobileMenuOpen(false);
    setIsSignOutOpen(true);
  };
  const handleCloseSignOut = () => setIsSignOutOpen(false);

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
        <div className="px-5 pt-6 pb-8 flex justify-center">
          <Link href="/dashboard" className="group">
            <Image
              src="/brand/verso-mark.png"
              alt="Verso logo"
              width={56}
              height={56}
              className="w-14 h-14 shrink-0 group-hover:scale-105 transition-transform"
              priority
            />
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
              <NotificationIcon className="w-6 h-6" />
              Notifications
            </button>

            {notificationsOpen && (
              <div className="absolute left-full top-0 ml-3 w-72 z-50">
                <div className="rounded-2xl bg-surface border border-dashed border-pencil/40 shadow-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground-muted">
                        {notificationStatusLabel}
                      </span>
                      {hasNotifications && (
                        <button
                          type="button"
                          onClick={handleClearNotifications}
                          disabled={clearNotifications.isPending}
                          className="text-xs text-foreground-muted hover:text-foreground transition-colors disabled:text-foreground-muted/60 disabled:cursor-not-allowed"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  {isLoadingNotifications ? (
                    <div className="text-xs text-foreground-muted bg-background-muted border border-border rounded-xl px-3 py-3 text-center">
                      Checking your notifications...
                    </div>
                  ) : !hasNotifications ? (
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
            onClick={handleOpenSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-foreground-muted hover:text-error hover:bg-error/10"
          >
            <span className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-full overflow-hidden border border-border bg-background-muted flex items-center justify-center text-xs font-semibold text-foreground">
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile?.full_name ? `${userProfile.full_name} avatar` : 'User avatar'}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{avatarFallback}</span>
                )}
              </span>
              <Logout01Icon className="w-5 h-5" />
            </span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════════ Mobile Navigation (Dock + Floaties) ═══════════════ */}
      <div className="md:hidden">
        {/* Top Floating Actions */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 pointer-events-none">
          <div className="pointer-events-auto">
            <Link 
              href="/dashboard" 
              className="group p-2.5 rounded-2xl bg-surface/80 backdrop-blur-md border border-border shadow-[0_4px_12px_rgba(60,50,40,0.08)] flex items-center transition-transform active:scale-95"
            >
              <Image
                src="/brand/verso-mark.png"
                alt="Verso"
                width={28}
                height={28}
                className="w-7 h-7"
                priority
              />
            </Link>
          </div>
          
          <div className="flex items-center gap-2.5 pointer-events-auto" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`p-2.5 rounded-2xl bg-surface/80 backdrop-blur-md border transition-all duration-300 shadow-[0_4px_12px_rgba(60,50,40,0.08)] relative active:scale-95 ${
                notificationsOpen ? "border-pencil/40 text-primary" : "border-border text-foreground-muted"
              }`}
            >
              <NotificationIcon className="w-6 h-6" />
              {hasNotifications && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-surface animate-pulse" />
              )}
            </button>

            <button
              onClick={handleOpenSignOut}
              className="h-11 w-11 rounded-2xl bg-surface/80 backdrop-blur-md border border-border shadow-[0_4px_12px_rgba(60,50,40,0.08)] overflow-hidden flex items-center justify-center p-0.5 active:scale-95 transition-transform"
            >
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs font-bold text-foreground">{avatarFallback}</span>
              )}
            </button>
          </div>
        </div>

        {/* Notification Overlay (Mobile) */}
        <AnimatePresence>
          {notificationsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed top-20 right-4 left-4 z-[60]"
            >
              <div className="rounded-[2rem] bg-surface/95 backdrop-blur-xl border border-pencil/30 shadow-2xl p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-foreground">Notifications</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-foreground-muted bg-background-muted px-2 py-1 rounded-lg">
                      {notificationStatusLabel}
                    </span>
                    {hasNotifications && (
                      <button
                        type="button"
                        onClick={handleClearNotifications}
                        disabled={clearNotifications.isPending}
                        className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {isLoadingNotifications ? (
                    <div className="py-8 text-center bg-background-muted/50 rounded-2xl border border-dashed border-border">
                      <p className="text-sm text-foreground-muted">Syncing...</p>
                    </div>
                  ) : !hasNotifications ? (
                    <div className="py-10 text-center flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-background-muted flex items-center justify-center">
                        <NotificationIcon className="w-6 h-6 text-foreground-muted opacity-40" />
                      </div>
                      <p className="text-sm text-foreground-muted font-medium">All caught up!</p>
                    </div>
                  ) : (
                    notifications.map((note) => (
                      <div key={note.id} className="group relative p-4 rounded-2xl border border-border bg-background-muted/40 hover:bg-background-muted active:scale-[0.98] transition-all">
                        <p className="text-sm font-bold text-foreground mb-1">{note.title}</p>
                        <p className="text-xs text-foreground-muted leading-relaxed">{note.detail}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Dock (Bottom) */}
        <div className="fixed bottom-6 left-0 right-0 z-50 px-5 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-surface/90 backdrop-blur-xl border border-border rounded-[2.5rem] shadow-[0_12px_40px_rgba(60,50,40,0.18)] p-2.5 flex items-center justify-around gap-1 w-full max-w-md">
            {[...navItems, ...secondaryItems].map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative p-3 rounded-[1.25rem] transition-all duration-300 flex items-center justify-center group ${
                    isActive ? "text-primary scale-110" : "text-foreground-muted hover:text-foreground active:scale-90"
                  }`}
                >
                  <div className={`transition-transform duration-300 ${isActive ? "drop-shadow-[0_0_8px_rgba(43,93,139,0.3)]" : ""}`}>
                    {item.href === '/dashboard' ? <DashboardIcon className="w-6 h-6" /> :
                     item.href === '/library' ? <NotebookIcon className="w-6 h-6" /> :
                     item.href === '/flashcards' ? <FlashcardIcon className="w-6 h-6" /> :
                     item.href === '/exams' ? <ExamIcon className="w-6 h-6" /> :
                     item.href === '/saved' ? <SavedIcon className="w-6 h-6" /> :
                     item.href === '/community' ? <CommunityIcon className="w-6 h-6" /> : null}
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="mobile-dock-dot"
                      className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  {/* Tooltip-like indicator on active */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-10 px-3 py-1 bg-foreground text-surface rounded-full text-[10px] font-bold shadow-lg pointer-events-none whitespace-nowrap"
                      >
                        {item.name}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <SignOutModal isOpen={isSignOutOpen} onClose={handleCloseSignOut} />
    </>
  );
}

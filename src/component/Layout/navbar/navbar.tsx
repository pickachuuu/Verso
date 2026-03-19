'use client';

import { navItems } from "./navConfig";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Logout01Icon, Menu01Icon, Cancel01Icon, ArrowLeft01Icon, ArrowRight01Icon } from "hugeicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUserProfile } from '@/hooks/useAuth';
import { NotebookIcon, FlashcardIcon, ExamIcon, DashboardIcon, SavedIcon, CommunityIcon, NotificationIcon } from '@/component/icons';
import { useCardsDue, useClearNotifications, useNotificationDismissals, useStudyStreak } from '@/hooks';
import SignOutModal from '@/component/ui/SignOutModal';

const SIDEBAR_STORAGE_KEY = 'verso-sidebar-collapsed';

const getNavIcon = (href: string) => {
  switch (href) {
    case '/dashboard': return <DashboardIcon className="w-5 h-5" />;
    case '/library': return <NotebookIcon className="w-5 h-5" />;
    case '/flashcards': return <FlashcardIcon className="w-5 h-5" />;
    case '/exams': return <ExamIcon className="w-5 h-5" />;
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

  // Collapsed state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === 'true') setIsCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)); } catch {}
      // Dispatch a custom event so the layout can listen
      window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: next } }));
      return next;
    });
  }, []);

  // Fire initial event after mount so layout picks up stored state
  useEffect(() => {
    if (hasMounted) {
      window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: isCollapsed } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMounted]);

  const avatarLabelSource = (userProfile?.full_name || userProfile?.email || '').trim();
  const avatarFallback = (() => {
    if (!avatarLabelSource) return 'U';
    if (avatarLabelSource.includes('@')) return avatarLabelSource[0]?.toUpperCase() || 'U';
    const parts = avatarLabelSource.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  })();

  const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || '';

  const secondaryItems = [
    { name: 'Saved', href: '/saved', icon: <SavedIcon className="w-5 h-5" /> },
    { name: 'Community', href: '/community', icon: <CommunityIcon className="w-5 h-5" /> },
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
    if (!mobileMenuOpen) setNotificationsOpen(false);
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

  const sidebarWidth = isCollapsed ? 'w-[5rem]' : 'w-[18rem]';

  return (
    <>
      {/* ═══════════════ Desktop Sidebar ═══════════════ */}
      <aside className={`hidden md:flex fixed left-0 top-0 bottom-0 z-50 flex-col bg-surface border-r-2 border-border/30 transition-all duration-300 ease-in-out ${sidebarWidth}`}>
        
        {/* Logo */}
        <div className={`flex items-center pt-8 pb-6 ${isCollapsed ? 'justify-center px-2' : 'px-6'}`}>
          <Link href="/dashboard" className="group shrink-0">
            <Image
              src="/brand/verso-mark.png"
              alt="Verso logo"
              width={isCollapsed ? 36 : 44}
              height={isCollapsed ? 36 : 44}
              className="shrink-0 group-hover:scale-110 transition-transform duration-300"
              priority
            />
          </Link>
        </div>

        {/* Primary Navigation */}
        <nav className={`flex-1 flex flex-col ${isCollapsed ? 'px-2' : 'px-3'} gap-1`}>
          {navItems.map((item, index) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={index}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`group relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'px-0 py-3' : 'px-4 py-3'} rounded-2xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-foreground text-surface shadow-md'
                    : 'text-foreground-muted hover:bg-background-muted hover:text-foreground'
                }`}
              >
                <span className="shrink-0">{getNavIcon(item.href)}</span>
                {!isCollapsed && (
                  <span className="font-black text-[13px] uppercase tracking-[0.12em] leading-none mt-0.5 truncate">
                    {item.name}
                  </span>
                )}
                {/* Collapsed tooltip */}
                {isCollapsed && (
                  <span className="absolute left-full ml-3 px-3 py-1.5 rounded-full bg-foreground text-surface text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[60]">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div className={`my-2 h-[3px] bg-foreground/5 rounded-full ${isCollapsed ? 'mx-2' : 'mx-3'}`} />

          {/* Secondary Items */}
          {secondaryItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`group relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'px-0 py-3' : 'px-4 py-3'} rounded-2xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-foreground text-surface shadow-md'
                    : 'text-foreground-muted hover:bg-background-muted hover:text-foreground'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className="font-black text-[11px] uppercase tracking-[0.15em] leading-none mt-0.5 truncate">
                    {item.name}
                  </span>
                )}
                {isCollapsed && (
                  <span className="absolute left-full ml-3 px-3 py-1.5 rounded-full bg-foreground text-surface text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[60]">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              title={isCollapsed ? 'Notifications' : undefined}
              className={`group relative w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'px-0 py-3' : 'px-4 py-3'} rounded-2xl text-sm transition-all duration-200 ${
                notificationsOpen
                  ? 'bg-background-muted text-foreground'
                  : 'text-foreground-muted hover:bg-background-muted hover:text-foreground'
              }`}
            >
              <span className="relative shrink-0">
                <NotificationIcon className="w-5 h-5" />
                {hasNotifications && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-surface animate-pulse" />
                )}
              </span>
              {!isCollapsed && (
                <span className="font-black text-[13px] uppercase tracking-[0.12em] leading-none mt-0.5">
                  ALERTS
                </span>
              )}
              {isCollapsed && (
                <span className="absolute left-full ml-3 px-3 py-1.5 rounded-full bg-foreground text-surface text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[60]">
                  ALERTS
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {notificationsOpen && (
              <div className={`absolute ${isCollapsed ? 'left-full ml-2' : 'left-full ml-3'} top-0 w-72 z-50`}>
                <div className="rounded-[2rem] bg-surface border-2 border-border/40 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground">NOTIFICATIONS</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-foreground-muted bg-background-muted px-2 py-1 rounded-full">
                        {notificationStatusLabel}
                      </span>
                      {hasNotifications && (
                        <button
                          type="button"
                          onClick={handleClearNotifications}
                          disabled={clearNotifications.isPending}
                          className="text-[9px] font-black uppercase tracking-widest text-foreground-muted hover:text-foreground transition-colors"
                        >
                          CLEAR
                        </button>
                      )}
                    </div>
                  </div>
                  {isLoadingNotifications ? (
                    <div className="text-[10px] font-black uppercase tracking-widest text-foreground-muted bg-background-muted rounded-2xl px-4 py-4 text-center">
                      CHECKING...
                    </div>
                  ) : !hasNotifications ? (
                    <div className="text-[10px] font-black uppercase tracking-widest text-foreground-muted bg-background-muted rounded-2xl px-4 py-4 text-center">
                      ALL CAUGHT UP
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((note) => (
                        <div key={note.id} className="rounded-2xl border-2 border-border/40 bg-background-muted/50 px-4 py-3">
                          <p className="text-[11px] font-black text-foreground uppercase tracking-wider">{note.title}</p>
                          <p className="text-[10px] text-foreground-muted mt-1 leading-relaxed">{note.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />
        </nav>

        {/* Bottom: Avatar + Sign Out + Collapse Toggle */}
        <div className={`pb-6 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <div className={`h-[3px] bg-foreground/5 rounded-full mb-4 ${isCollapsed ? 'mx-2' : 'mx-3'}`} />

          {/* Avatar + Sign Out */}
          <button
            onClick={handleOpenSignOut}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`group relative w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'px-0 py-3' : 'px-4 py-3'} rounded-2xl text-sm transition-all text-foreground-muted hover:text-foreground hover:bg-background-muted`}
          >
            <span className="h-9 w-9 rounded-full overflow-hidden border-2 border-border bg-background-muted flex items-center justify-center text-[10px] font-black text-foreground shrink-0">
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
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="font-black text-[12px] uppercase tracking-[0.12em] text-foreground truncate leading-none">{displayName}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mt-1.5 flex items-center gap-1">
                  <Logout01Icon className="w-3 h-3" />
                  SIGN OUT
                </p>
              </div>
            )}
            {isCollapsed && (
              <span className="absolute left-full ml-3 px-3 py-1.5 rounded-full bg-foreground text-surface text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[60]">
                SIGN OUT
              </span>
            )}
          </button>

          {/* Collapse/Expand Toggle — always at the bottom */}
          <button
            onClick={toggleCollapse}
            className={`w-full mt-2 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-2xl text-foreground-muted hover:text-foreground hover:bg-background-muted transition-all active:scale-90`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ArrowRight01Icon className="w-4 h-4" /> : <ArrowLeft01Icon className="w-4 h-4" />}
            {!isCollapsed && (
              <span className="font-black text-[10px] uppercase tracking-widest leading-none mt-0.5">COLLAPSE</span>
            )}
          </button>
        </div>
      </aside>

      {/* ═══════════════ Mobile Navigation (Premium Island Dock) ═══════════════ */}
      <div className="md:hidden">
        {/* Top Floating Actions - Refined */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 pointer-events-none">
          <div className="pointer-events-auto">
            <Link 
              href="/dashboard" 
              className="group p-2.5 rounded-[1.25rem] bg-surface/80 backdrop-blur-xl border border-border/50 shadow-[0_8px_20px_rgba(60,50,40,0.12)] flex items-center transition-all active:scale-95 hover:bg-surface"
            >
              <Image
                src="/brand/verso-mark.png"
                alt="Verso"
                width={26}
                height={26}
                className="w-6.5 h-6.5"
                priority
              />
            </Link>
          </div>
          
          <div className="flex items-center gap-3 pointer-events-auto" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`p-2.5 rounded-[1.25rem] bg-surface/80 backdrop-blur-xl border transition-all duration-300 shadow-[0_8px_20px_rgba(60,50,40,0.12)] relative active:scale-95 ${
                notificationsOpen ? "border-primary/40 text-primary ring-4 ring-primary/5" : "border-border/50 text-foreground-muted hover:bg-surface"
              }`}
            >
              <NotificationIcon className="w-6 h-6" />
              {hasNotifications && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-surface shadow-[0_0_8px_rgba(199,123,75,0.4)] animate-pulse" />
              )}
            </button>

            <button
              onClick={handleOpenSignOut}
              className="h-11 w-11 rounded-[1.25rem] bg-surface/80 backdrop-blur-xl border border-border/50 shadow-[0_8px_20px_rgba(60,50,40,0.12)] overflow-hidden flex items-center justify-center p-0.5 active:scale-95 transition-all hover:bg-surface"
            >
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover rounded-[0.9rem]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs font-bold text-foreground">{avatarFallback}</span>
              )}
            </button>
          </div>
        </div>

        {/* Notification Overlay (Refined Mobile View) */}
        <AnimatePresence>
          {notificationsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.96 }}
              className="fixed top-24 right-4 left-4 z-[60]"
            >
              <div className="rounded-[2.5rem] bg-surface/98 backdrop-blur-2xl border border-pencil/20 shadow-[0_30px_70px_rgba(60,50,40,0.3)] p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-foreground">Notifications</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted bg-background-muted px-2.5 py-1.5 rounded-xl border border-border/50">
                      {notificationStatusLabel}
                    </span>
                    {hasNotifications && (
                      <button
                        type="button"
                        onClick={handleClearNotifications}
                        disabled={clearNotifications.isPending}
                        className="text-xs font-bold text-primary hover:text-primary-dark transition-colors px-2 py-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[55vh] overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                  {isLoadingNotifications ? (
                    <div className="py-12 text-center bg-background-muted/40 rounded-3xl border border-dashed border-border/60">
                      <p className="text-sm text-foreground-muted font-medium animate-pulse">Checking for updates...</p>
                    </div>
                  ) : !hasNotifications ? (
                    <div className="py-14 text-center flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-background-muted flex items-center justify-center shadow-inner">
                        <NotificationIcon className="w-8 h-8 text-foreground-muted opacity-30" />
                      </div>
                      <p className="text-sm text-foreground-muted font-bold">You&apos;re all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((note) => (
                      <div key={note.id} className="group relative p-4 rounded-2xl border border-border/60 bg-background-muted/30 hover:bg-background-muted/60 active:scale-[0.98] transition-all">
                        <p className="text-sm font-bold text-foreground mb-1">{note.title}</p>
                        <p className="text-xs text-foreground-muted leading-relaxed opacity-80">{note.detail}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Dock (Bottom Centerpiece) - Planted to bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto bg-surface/95 backdrop-blur-2xl border-t border-border/50 flex items-stretch h-[4.75rem] w-full px-2 pb-safe">
            {[...navItems, ...secondaryItems].map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              const displayName = item.name === 'Saved Materials' ? 'Saved' : item.name;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 active:scale-95 ${
                    isActive ? "text-primary" : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  <div className={`transition-all duration-400 ${isActive ? "scale-105 drop-shadow-[0_0_10px_rgba(43,93,139,0.25)]" : "opacity-70"}`}>
                    {item.href === '/dashboard' ? <DashboardIcon className="w-6 h-6" /> :
                     item.href === '/library' ? <NotebookIcon className="w-6 h-6" /> :
                     item.href === '/flashcards' ? <FlashcardIcon className="w-6 h-6" /> :
                     item.href === '/exams' ? <ExamIcon className="w-6 h-6" /> :
                     item.href === '/saved' ? <SavedIcon className="w-6 h-6" /> :
                     item.href === '/community' ? <CommunityIcon className="w-6 h-6" /> : null}
                  </div>
                  
                  <span className={`text-[9px] font-black uppercase tracking-wider text-center leading-none transition-all duration-300 px-0.5 ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-40 translate-y-0.5"
                  }`}>
                    {displayName}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="mobile-dock-dot"
                      className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
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

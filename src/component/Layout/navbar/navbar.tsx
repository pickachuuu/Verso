'use client';

import { navItems } from "./navConfig";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Logout01Icon, Menu01Icon, Cancel01Icon } from "hugeicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from '@/hook/useAuthActions';
import { useUserProfile } from '@/hooks/useAuth';
import { NotebookIcon, FlashcardIcon, ExamIcon, DashboardIcon, SavedIcon, CommunityIcon, NotificationIcon } from '@/component/icons';
import { useCardsDue, useClearNotifications, useNotificationDismissals, useStudyStreak } from '@/hooks';
import Modal from '@/component/ui/Modal';
import Card from '@/component/ui/Card';
import Button from '@/component/ui/Button';

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
  const [isSigningOut, setIsSigningOut] = useState(false);

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
  const handleCloseSignOut = () => {
    if (!isSigningOut) {
      setIsSignOutOpen(false);
    }
  };

  const handleConfirmSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

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
            <Image
              src="/brand/verso-mark.png"
              alt="Verso logo"
              width={48}
              height={48}
              className="w-12 h-12 shrink-0 group-hover:scale-105 transition-transform"
              priority
            />
            <span className="text-xl font-bold text-foreground group-hover:text-foreground transition-colors tracking-tight">
              Verso
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

      {/* ═══════════════ Mobile Top Bar ═══════════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="px-4 py-3 bg-surface/95 backdrop-blur-md border-b border-border shadow-sm relative z-50">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/brand/verso-mark.png"
                alt="Verso logo"
                width={40}
                height={40}
                className="w-10 h-10 shrink-0"
                priority
              />
              <span className="text-lg font-bold text-foreground">Verso</span>
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
        <AnimatePresence initial={false}>
          {mobileMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ height: 0, opacity: 0, y: -8 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="px-4 pb-4 bg-surface border-t border-border shadow-md overflow-hidden origin-top relative z-40"
            >
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
                <NotificationIcon className="w-5 h-5" />
                Notifications
              </button>

              {notificationsOpen && (
                <div className="rounded-2xl bg-surface border border-dashed border-pencil/40 shadow-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">Notifications</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-foreground-muted">
                        {notificationStatusLabel}
                      </span>
                      {hasNotifications && (
                        <button
                          type="button"
                          onClick={handleClearNotifications}
                          disabled={clearNotifications.isPending}
                          className="text-[10px] text-foreground-muted hover:text-foreground transition-colors disabled:text-foreground-muted/60 disabled:cursor-not-allowed"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  {isLoadingNotifications ? (
                    <div className="text-[11px] text-foreground-muted bg-background-muted border border-border rounded-xl px-3 py-2 text-center">
                      Checking your notifications...
                    </div>
                  ) : !hasNotifications ? (
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
              <div className="my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <button
                type="button"
                onClick={handleOpenSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border text-foreground-muted border-transparent hover:bg-background-muted hover:text-error hover:border-border"
              >
                <Logout01Icon className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <Modal isOpen={isSignOutOpen} onClose={handleCloseSignOut}>
        <Card className="w-full max-w-md">
          <Card.Header className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-background-muted rounded-full flex items-center justify-center border border-border">
              <Logout01Icon className="w-6 h-6 text-foreground-muted" />
            </div>
            <Card.Title className="text-lg font-semibold">Sign out</Card.Title>
            <Card.Description className="text-foreground-muted">
              Are you sure you want to sign out?
            </Card.Description>
          </Card.Header>

          <Card.Footer className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleCloseSignOut}
              disabled={isSigningOut}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSignOut}
              disabled={isSigningOut}
              className="flex-1"
            >
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </Card.Footer>
        </Card>
      </Modal>
    </>
  );
}

'use client';

import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import { File01Icon, BookOpen01Icon, Clock01Icon, ArrowRight01Icon } from 'hugeicons-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

const supabase = createClient();

interface ActivityItemProps {
  id: string;
  type: 'note' | 'flashcard' | 'session';
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  href?: string;
}

function ActivityItem({ type, title, description, time, icon, href }: ActivityItemProps) {
  const getTypeBadge = () => {
    switch (type) {
      case 'note':
        return <ClayBadge variant="accent" className="text-xs px-2 py-1">Note</ClayBadge>;
      case 'flashcard':
        return <ClayBadge variant="success" className="text-xs px-2 py-1">Flashcard</ClayBadge>;
      case 'session':
        return <ClayBadge variant="warning" className="text-xs px-2 py-1">Session</ClayBadge>;
      default:
        return null;
    }
  };

  const content = (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-background-muted/50 hover:bg-background-muted transition-all duration-200 group cursor-pointer">
      <div className="p-3 rounded-xl bg-surface shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">{title}</h4>
          {getTypeBadge()}
        </div>
        <p className="text-sm text-foreground-muted truncate">{description}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <Clock01Icon className="w-3.5 h-3.5" />
          <span>{time}</span>
        </div>
        <ArrowRight01Icon className="w-4 h-4 text-foreground-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function ActivityItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-background-muted/50 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-background-muted" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-40 bg-background-muted rounded-lg" />
        <div className="h-3 w-56 bg-background-muted rounded-lg" />
      </div>
      <div className="w-16 h-4 bg-background-muted rounded-lg" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-2xl bg-background-muted mb-4">
        <Clock01Icon className="w-8 h-8 text-foreground-muted" />
      </div>
      <h4 className="font-semibold text-foreground mb-1">No recent activity</h4>
      <p className="text-sm text-foreground-muted max-w-[200px]">
        Start creating notes or flashcards to see your activity here
      </p>
    </div>
  );
}

export default function RecentActivity() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItemProps[]>([]);

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      let userId = session?.user?.id;
      let items: ActivityItemProps[] = [];

      if (userId) {
        // Fetch recent notes
        const { data: notes } = await supabase
          .from('notes')
          .select('id, title, slug, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(3);

        if (notes) {
          items = items.concat(notes.map((note: any) => ({
            id: note.id,
            type: 'note' as const,
            title: note.title || 'Untitled Note',
            description: 'Updated note',
            time: note.updated_at ? timeAgo(note.updated_at) : '',
            icon: <File01Icon className="w-5 h-5 text-accent" />,
            href: `/notes/${note.slug || note.id}`,
          })));
        }

        // Fetch recent flashcard sets
        const { data: flashcardSets } = await supabase
          .from('flashcard_sets')
          .select('id, title, updated_at, total_cards')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(2);

        if (flashcardSets) {
          items = items.concat(flashcardSets.map((set: any) => ({
            id: set.id,
            type: 'flashcard' as const,
            title: set.title || 'Flashcard Set',
            description: `${set.total_cards || 0} cards`,
            time: set.updated_at ? timeAgo(set.updated_at) : '',
            icon: <BookOpen01Icon className="w-5 h-5 text-green-600" />,
            href: `/flashcards/${set.id}`,
          })));
        }
      }

      // Sort by most recent
      items.sort((a, b) => {
        const timeA = parseTimeAgo(a.time);
        const timeB = parseTimeAgo(b.time);
        return timeA - timeB;
      });

      setActivities(items.slice(0, 5));
      setLoading(false);
    }

    fetchActivities();
  }, []);

  function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function parseTimeAgo(timeStr: string): number {
    const match = timeStr.match(/(\d+)([smhd])/);
    if (!match) return Infinity;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return Infinity;
    }
  }

  return (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-foreground-muted">Your latest learning activities</p>
        </div>
        <Link href="/notes" className="text-sm text-accent hover:text-accent-light font-medium flex items-center gap-1 transition-colors">
          View all
          <ArrowRight01Icon className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <ActivityItemSkeleton key={i} />)
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityItem key={activity.id} {...activity} />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </ClayCard>
  );
}

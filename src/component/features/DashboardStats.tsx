'use client';

import { ClayCard, ClayIconBox } from '@/component/ui/Clay';
import { File01Icon, BookOpen01Icon, Target01Icon, TickDouble01Icon } from 'hugeicons-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  accentColor?: string;
}

interface FlashcardSet {
  id: string;
  total_cards: number;
  mastered_cards: number;
  flashcards: Array<{
    id: string;
    status: string;
  }>;
}

function StatCardSkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-24 bg-background-muted rounded-lg" />
          <div className="h-9 w-16 bg-background-muted rounded-lg" />
          <div className="h-3 w-32 bg-background-muted rounded-lg" />
        </div>
        <div className="w-14 h-14 bg-background-muted rounded-2xl" />
      </div>
    </ClayCard>
  );
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground-muted uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-bold text-foreground tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-foreground-muted">{description}</p>
          )}
        </div>
        <ClayIconBox size="md" variant="accent" className="shrink-0">
          {icon}
        </ClayIconBox>
      </div>
    </ClayCard>
  );
}

export default function DashboardStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCardProps[]>([
    { title: 'Notes', value: 0, icon: <File01Icon className="w-6 h-6 text-accent" />, description: 'Total study notes' },
    { title: 'Flashcards', value: 0, icon: <BookOpen01Icon className="w-6 h-6 text-accent" />, description: 'Cards created' },
    { title: 'Sets', value: 0, icon: <Target01Icon className="w-6 h-6 text-accent" />, description: 'Flashcard sets' },
    { title: 'Mastered', value: 0, icon: <TickDouble01Icon className="w-6 h-6 text-accent" />, description: 'Cards completed' },
  ]);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      let userId = session?.user?.id;

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch notes count
        const { count: notesCount } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Fetch flashcard sets and their data
        const { data: flashcardSets } = await supabase
          .from('flashcard_sets')
          .select(`
            id,
            total_cards,
            mastered_cards,
            flashcards (
              id,
              status
            )
          `)
          .eq('user_id', userId);

        let totalFlashcardSets = 0;
        let totalFlashcards = 0;
        let totalMasteredCards = 0;
        let fullyMasteredSets = 0;

        if (flashcardSets) {
          totalFlashcardSets = flashcardSets.length;

          // Calculate totals and check for fully mastered sets
          flashcardSets.forEach((set: FlashcardSet) => {
            totalFlashcards += set.total_cards || 0;
            totalMasteredCards += set.mastered_cards || 0;

            // Check if all cards in this set are mastered
            if (set.flashcards && set.flashcards.length > 0) {
              const allMastered = set.flashcards.every((card) => card.status === 'mastered');
              if (allMastered) {
                fullyMasteredSets++;
              }
            }
          });
        }

        setStats([
          {
            title: 'Notes',
            value: notesCount || 0,
            icon: <File01Icon className="w-6 h-6 text-accent" />,
            description: 'Total study notes'
          },
          {
            title: 'Flashcards',
            value: totalFlashcards,
            icon: <BookOpen01Icon className="w-6 h-6 text-accent" />,
            description: 'Cards created'
          },
          {
            title: 'Sets',
            value: totalFlashcardSets,
            icon: <Target01Icon className="w-6 h-6 text-accent" />,
            description: fullyMasteredSets > 0 ? `${fullyMasteredSets} completed` : 'Flashcard sets'
          },
          {
            title: 'Mastered',
            value: totalMasteredCards,
            icon: <TickDouble01Icon className="w-6 h-6 text-accent" />,
            description: 'Cards completed'
          },
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Overview</h2>
        <span className="text-sm text-foreground-muted">Your learning stats</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat, index) => <StatCard key={index} {...stat} />)
        }
      </div>
    </div>
  );
}

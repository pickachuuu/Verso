'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { ClayCard } from '@/component/ui/Clay';
import { FlashcardIcon } from '@/component/icons';
import {
  ArrowLeft01Icon,
  BookOpen01Icon,
  CheckmarkCircle01Icon,
  Search01Icon,
  ArrowDown01Icon,
  SparklesIcon,
} from 'hugeicons-react';
import { useStudySetData } from '@/hooks/useFlashcards';
import { Flashcard } from '@/lib/database.types';

type StatusFilter = 'all' | 'new' | 'learning' | 'review' | 'mastered';

export default function FlashcardBrowsePage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.setId as string;

  const { data: studyData, isLoading } = useStudySetData(setId);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const filteredCards = useMemo(() => {
    if (!studyData?.cards) return [];

    let cards = [...studyData.cards];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(
        (card) =>
          card.question.toLowerCase().includes(query) ||
          card.answer.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      cards = cards.filter((card) => card.status === statusFilter);
    }

    return cards;
  }, [studyData?.cards, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    if (!studyData?.cards) return { new: 0, learning: 0, review: 0, mastered: 0 };
    return {
      new: studyData.cards.filter((c) => c.status === 'new').length,
      learning: studyData.cards.filter((c) => c.status === 'learning').length,
      review: studyData.cards.filter((c) => c.status === 'review').length,
      mastered: studyData.cards.filter((c) => c.status === 'mastered').length,
    };
  }, [studyData?.cards]);

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!studyData?.cards) return;
    setExpandedCards(new Set(filteredCards.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedCards(new Set());
  };

  const allExpanded = filteredCards.length > 0 && filteredCards.every((c) => expandedCards.has(c.id));

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-surface-elevated rounded-xl" />
            <div className="h-6 w-48 bg-surface-elevated rounded-lg" />
          </div>
          <div className="h-2 bg-surface-elevated rounded-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-elevated rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Not found
  if (!studyData) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <ClayCard variant="elevated" padding="lg" className="rounded-3xl text-center">
          <div className="py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <FlashcardIcon className="w-10 h-10 text-primary-light" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Set Not Found</h2>
            <p className="text-foreground-muted mb-8">
              The flashcard set you&apos;re looking for doesn&apos;t exist.
            </p>
            <button
              onClick={() => router.push('/flashcards')}
              className="px-6 py-3 rounded-xl font-semibold bg-primary text-white hover:bg-primary-dark transition-all"
            >
              Back to Flashcard Sets
            </button>
          </div>
        </ClayCard>
      </div>
    );
  }

  const progress = studyData.progress;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <ClayCard variant="elevated" padding="md" className="rounded-3xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/flashcards')}
              className="p-2 rounded-xl bg-background-muted border border-border hover:bg-background-muted/70 transition-all flex-shrink-0"
              title="Back to sets"
            >
              <ArrowLeft01Icon className="w-4 h-4 text-foreground-muted" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                {studyData.set.title || 'Flashcards'}
              </h1>
              <p className="text-xs text-foreground-muted mt-0.5">
                {progress.total} cards · {progress.mastered} mastered
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push(`/flashcards/${setId}/study`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
          >
            <BookOpen01Icon className="w-4 h-4" />
            Study Due Cards
          </button>
        </div>
      </ClayCard>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-3">
          <ClayCard variant="default" padding="md" className="rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search01Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-foreground placeholder:text-foreground-muted"
                />
              </div>
              <button
                onClick={allExpanded ? collapseAll : expandAll}
                className="px-3 py-2.5 rounded-xl text-xs font-medium border border-border bg-background-muted hover:bg-background-muted/70 text-foreground-muted hover:text-foreground transition-all whitespace-nowrap"
              >
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          </ClayCard>

          {filteredCards.length === 0 ? (
            <ClayCard variant="default" padding="lg" className="rounded-2xl text-center">
              <p className="text-foreground-muted py-8">
                {searchQuery || statusFilter !== 'all'
                  ? 'No cards match your filters.'
                  : 'No cards in this set.'}
              </p>
            </ClayCard>
          ) : (
            <div className="space-y-2">
              {filteredCards.map((card, index) => (
                <BrowseCard
                  key={card.id}
                  card={card}
                  index={index}
                  isExpanded={expandedCards.has(card.id)}
                  onToggle={() => toggleCard(card.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-3">
          <ClayCard variant="default" padding="md" className="rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-muted">
                {progress.mastered}/{progress.total} mastered
              </span>
              <span className="text-xs font-semibold text-primary-light">{progress.percentage}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-background-muted overflow-hidden border border-border/20">
              <div
            className="h-full rounded-full bg-primary/70 transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </ClayCard>

          <ClayCard variant="default" padding="md" className="rounded-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPill
                label="All"
                count={studyData.cards.length}
                active={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
              />
              <StatusPill
                label="New"
                count={statusCounts.new}
                active={statusFilter === 'new'}
                onClick={() => setStatusFilter('new')}
                color="text-blue-400"
              />
              <StatusPill
                label="Learning"
                count={statusCounts.learning}
                active={statusFilter === 'learning'}
                onClick={() => setStatusFilter('learning')}
                color="text-orange-400"
              />
              <StatusPill
                label="Review"
                count={statusCounts.review}
                active={statusFilter === 'review'}
                onClick={() => setStatusFilter('review')}
                color="text-purple-400"
              />
              <StatusPill
                label="Mastered"
                count={statusCounts.mastered}
                active={statusFilter === 'mastered'}
                onClick={() => setStatusFilter('mastered')}
                color="text-emerald-400"
              />
            </div>
          </ClayCard>
        </div>
      </div>

      <p className="text-center text-xs text-foreground-muted/60 pb-4">
        Showing {filteredCards.length} of {studyData.cards.length} cards
      </p>
    </div>
  );
}

// ════════════════════════════════════════════
//  Sub-components
// ════════════════════════════════════════════

function StatusPill({
  label,
  count,
  active,
  onClick,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active
          ? 'bg-surface-elevated text-foreground shadow-sm border border-border/60'
          : 'text-foreground-muted hover:text-foreground border border-transparent'
      }`}
    >
      <span className={active && color ? color : ''}>{label}</span>
      <span className="ml-1.5 opacity-60">{count}</span>
    </button>
  );
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-blue-500/10 border-blue-500/15', text: 'text-blue-400', label: 'New' },
  learning: { bg: 'bg-orange-500/10 border-orange-500/15', text: 'text-orange-400', label: 'Learning' },
  review: { bg: 'bg-purple-500/10 border-purple-500/15', text: 'text-purple-400', label: 'Review' },
  mastered: { bg: 'bg-emerald-500/10 border-emerald-500/15', text: 'text-emerald-400', label: 'Mastered' },
};

function BrowseCard({
  card,
  index,
  isExpanded,
  onToggle,
}: {
  card: Flashcard;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const statusStyle = STATUS_STYLES[card.status] || STATUS_STYLES.new;

  const difficultyLabel =
    card.difficulty_level === 1 ? 'Easy' : card.difficulty_level === 3 ? 'Hard' : 'Medium';
  const difficultyColor =
    card.difficulty_level === 1
      ? 'text-emerald-500'
      : card.difficulty_level === 3
      ? 'text-red-500'
      : 'text-amber-500';

  return (
    <ClayCard variant="default" padding="none" className="rounded-2xl overflow-hidden">
      {/* Question row (always visible, clickable) */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface-elevated/30 transition-all"
      >
        {/* Card number */}
        <span className="text-xs font-bold text-foreground-muted/40 w-6 text-right flex-shrink-0">
          {index + 1}
        </span>

        {/* Question */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-relaxed line-clamp-2">
            {card.question}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex-shrink-0 ${statusStyle.bg} ${statusStyle.text}`}
        >
          {statusStyle.label}
        </span>

        {/* Expand chevron */}
        <ArrowDown01Icon
          className={`w-4 h-4 text-foreground-muted transition-transform flex-shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Answer (expanded) */}
      {isExpanded && (
        <div className="border-t border-border/30 px-4 pb-4 pt-3 ml-10">
          <p className="text-[10px] uppercase tracking-widest font-bold text-primary-light/60 mb-2">
            Answer
          </p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {card.answer}
          </p>
          {/* Meta info */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/20">
            <span className={`text-[10px] font-medium ${difficultyColor}`}>{difficultyLabel}</span>
            {card.review_count > 0 && (
              <span className="text-[10px] text-foreground-muted">
                {card.review_count} review{card.review_count !== 1 ? 's' : ''} ·{' '}
                {card.correct_count}/{card.review_count} correct
              </span>
            )}
            {card.status === 'mastered' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <CheckmarkCircle01Icon className="w-3 h-3" />
                Mastered
              </span>
            )}
          </div>
        </div>
      )}
    </ClayCard>
  );
}

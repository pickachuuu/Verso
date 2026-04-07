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
    <div className="w-full max-w-6xl mx-auto py-8 sm:py-12 space-y-8 sm:space-y-12">
      <div className="bg-surface border-[3px] sm:border-[4px] border-foreground rounded-[2rem] sm:rounded-[2.5rem] shadow-[6px_6px_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_rgba(0,0,0,1)] p-6 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
            <button
              onClick={() => router.push('/flashcards')}
              className="w-12 h-12 flex items-center justify-center rounded-[1rem] bg-background-muted border-[2px] border-border/40 hover:border-foreground hover:bg-foreground hover:text-surface transition-all shrink-0 active:scale-90 shadow-sm"
              title="Back to sets"
            >
              <ArrowLeft01Icon className="w-5 h-5" />
            </button>
            <div className="min-w-0 py-1">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-1.5">
                FLASHCARDS DECK
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tighter uppercase leading-[0.95] break-words line-clamp-2">
                {studyData.set.title || 'Flashcards'}
              </h1>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="px-3 py-1 rounded-[0.5rem] border-[2px] border-border/40 bg-background-muted text-[10px] font-black uppercase tracking-widest text-foreground">
                  {progress.total} Cards
                </span>
                <span className="px-3 py-1 rounded-[0.5rem] border-[2px] border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  {progress.mastered} Mastered
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push(`/flashcards/${setId}/study`)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 sm:py-4 rounded-[1.5rem] font-black text-sm sm:text-base uppercase tracking-widest bg-foreground text-surface hover:bg-foreground/90 transition-all border-[3px] border-transparent shadow-lg active:scale-95 shrink-0"
          >
            <BookOpen01Icon className="w-6 h-6" />
            Study Due Cards
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface border-[2px] border-border/50 rounded-[1.5rem] p-3 flex flex-col sm:flex-row items-center gap-3 w-full group focus-within:border-foreground focus-within:shadow-md transition-all">
            <div className="flex-1 relative w-full">
              <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-foreground transition-colors" />
              <input
                type="text"
                placeholder="SEARCH CARDS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent border-none outline-none text-base font-black uppercase tracking-wider text-foreground placeholder:text-foreground/30"
              />
            </div>
            <button
              onClick={allExpanded ? collapseAll : expandAll}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border-[2px] border-border/40 bg-background-muted hover:border-foreground hover:bg-foreground hover:text-surface transition-all shrink-0 active:scale-95"
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          </div>

          {filteredCards.length === 0 ? (
             <div className="w-full py-24 flex flex-col items-center justify-center text-center border-[4px] border-dashed border-border/40 rounded-[2.5rem] bg-background-muted/20">
               <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-4">No cards found</h3>
               <p className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest leading-relaxed max-w-xs">
                 {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No cards in this deck.'}
               </p>
             </div>
          ) : (
            <div className="flex flex-col gap-4">
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

        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
          <div className="bg-surface border-[2px] border-border/50 rounded-[1.5rem] p-6 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-4">Mastery Progress</div>
            <div className="flex items-end justify-between mb-3">
              <span className="text-4xl font-black tracking-tighter leading-none">{progress.percentage}%</span>
              <span className="text-[11px] font-black text-foreground/50 uppercase tracking-widest">
                {progress.mastered}/{progress.total}
              </span>
            </div>
            <div className="h-3 rounded-full bg-background-muted overflow-hidden border border-border/40">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          <div className="bg-surface border-[2px] border-border/50 rounded-[1.5rem] p-6 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-5">Filter Deck</div>
            <div className="flex flex-col gap-2">
              <StatusPill
                label="All Cards"
                count={studyData.cards.length}
                active={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
              />
              <StatusPill
                label="New"
                count={statusCounts.new}
                active={statusFilter === 'new'}
                onClick={() => setStatusFilter('new')}
              />
              <StatusPill
                label="Learning"
                count={statusCounts.learning}
                active={statusFilter === 'learning'}
                onClick={() => setStatusFilter('learning')}
              />
              <StatusPill
                label="Review"
                count={statusCounts.review}
                active={statusFilter === 'review'}
                onClick={() => setStatusFilter('review')}
              />
              <StatusPill
                label="Mastered"
                count={statusCounts.mastered}
                active={statusFilter === 'mastered'}
                onClick={() => setStatusFilter('mastered')}
              />
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 pt-12 pb-4">
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
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-5 py-3 rounded-xl border-[2px] transition-all font-black uppercase tracking-widest text-xs active:scale-[0.98]
        ${active
          ? 'bg-foreground text-surface border-foreground shadow-sm'
          : 'bg-surface border-border/30 text-foreground/60 hover:border-border/60 hover:text-foreground'
        }`}
    >
      <span>{label}</span>
      <span className={`px-2 py-1 rounded-lg text-[10px] ${active ? 'bg-surface/20' : 'bg-background-muted text-foreground/50'}`}>{count}</span>
    </button>
  );
}

const STATUS_STYLES: Record<string, { border: string; text: string; label: string }> = {
  new: { border: 'border-blue-500/30', text: 'text-blue-500', label: 'New' },
  learning: { border: 'border-orange-500/30', text: 'text-orange-500', label: 'Learning' },
  review: { border: 'border-purple-500/30', text: 'text-purple-500', label: 'Review' },
  mastered: { border: 'border-emerald-500/30', text: 'text-emerald-500', label: 'Mastered' },
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

  const difficultyLabel = card.difficulty_level === 1 ? 'Easy' : card.difficulty_level === 3 ? 'Hard' : 'Med';
  const difficultyColorBorder = card.difficulty_level === 1 ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5' : card.difficulty_level === 3 ? 'border-red-500/40 text-red-600 bg-red-500/5' : 'border-amber-500/40 text-amber-600 bg-amber-500/5';

  return (
    <div className={`transition-all bg-surface border-[2px] rounded-[1.5rem] overflow-hidden ${isExpanded ? 'border-foreground shadow-md translate-y-[-2px]' : 'border-border/50 shadow-sm hover:border-border/80 hover:-translate-y-1 hover:shadow-md'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 sm:gap-4 p-5 sm:p-6 text-left"
      >
        <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-foreground text-surface font-black text-sm shrink-0 shadow-md">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] sm:text-lg font-black text-foreground leading-[1.15] sm:leading-tight line-clamp-2">
            {card.question}
          </p>
        </div>

        <span className={`hidden sm:flex px-3 py-1 rounded-[0.5rem] text-[10px] font-black uppercase tracking-widest border-[2px] flex-shrink-0 ${statusStyle.border} ${statusStyle.text} bg-transparent`}>
          {statusStyle.label}
        </span>

        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[2px] border-border/60 bg-background-muted flex items-center justify-center shrink-0 transition-transform ${isExpanded ? 'rotate-180 bg-foreground text-surface border-foreground' : ''}`}>
          <ArrowDown01Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t-[3px] border-foreground border-dashed px-5 sm:px-6 pb-6 pt-5 bg-background-muted/40">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-1.5 h-4 rounded-full bg-primary" />
             <p className="text-[10px] uppercase tracking-[0.3em] font-black text-foreground/50">
               Answer
             </p>
          </div>
          <p className="text-[15px] sm:text-[17px] text-foreground leading-relaxed whitespace-pre-wrap font-bold">
            {card.answer}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border/30">
            <span className={`px-2 py-1 rounded-[0.4rem] text-[9px] font-black uppercase tracking-widest border-[2px] ${difficultyColorBorder}`}>
              {difficultyLabel}
            </span>
            <span className={`sm:hidden px-2 py-1 rounded-[0.4rem] text-[9px] font-black uppercase tracking-widest border-[2px] ${statusStyle.border} ${statusStyle.text} bg-transparent`}>
              {statusStyle.label}
            </span>
            {card.review_count > 0 && (
              <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40 hidden sm:inline-block">
                {card.review_count} Reviews · {card.correct_count} Correct
              </span>
            )}
            {card.status === 'mastered' && (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-[0.4rem] border-[2px] border-emerald-500/20">
                <CheckmarkCircle01Icon className="w-3.5 h-3.5" />
                Mastered
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

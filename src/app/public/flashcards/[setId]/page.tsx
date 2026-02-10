'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { ClayCard } from '@/component/ui/Clay';
import Button from '@/component/ui/Button';
import { FlashcardIcon } from '@/component/icons';
import SaveMaterialModal from '@/component/features/modal/SaveMaterialModal';
import { useCopyPublicFlashcardSet, useSaveReference } from '@/hooks/useSavedMaterials';
import {
  ArrowLeft01Icon,
  ArrowDown01Icon,
  Bookmark01Icon,
  Share01Icon,
  Search01Icon,
  CheckmarkCircle01Icon,
} from 'hugeicons-react';

const supabase = createClient();

interface FlashcardSet {
  id: string;
  title: string;
  description: string | null;
  total_cards: number;
  user_id: string;
  created_at: string;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty_level: number;
}

type PublicBrowseCard = Flashcard & {
  status: 'new' | 'learning' | 'review' | 'mastered';
  review_count: number;
  correct_count: number;
};

export default function PublicFlashcardSetPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params?.setId as string;

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savingAction, setSavingAction] = useState<'reference' | 'copy' | null>(null);

  const saveReferenceMutation = useSaveReference();
  const copyFlashcardSetMutation = useCopyPublicFlashcardSet();

  useEffect(() => {
    const fetchPublicSet = async () => {
      if (!setId) return;

      try {
        const { data: setData, error: setError } = await supabase
          .from('flashcard_sets')
          .select('id, title, description, total_cards, user_id, created_at')
          .eq('id', setId)
          .eq('is_public', true)
          .single();

        if (setError || !setData) {
          setError('Flashcard set not found or not public');
          setLoading(false);
          return;
        }

        setSet(setData);

        const { data: cardsData, error: cardsError } = await supabase
          .from('flashcards')
          .select('id, question, answer, difficulty_level')
          .eq('set_id', setId)
          .order('position', { ascending: true });

        if (cardsError) {
          setError('Error loading flashcards');
          setLoading(false);
          return;
        }

        setFlashcards(cardsData || []);
        setLoading(false);
      } catch (err) {
        setError('An error occurred while loading the flashcard set');
        setLoading(false);
      }
    };

    fetchPublicSet();
  }, [setId]);

  const browseCards = useMemo<PublicBrowseCard[]>(
    () => flashcards.map((card) => ({
      ...card,
      status: 'new',
      review_count: 0,
      correct_count: 0,
    })),
    [flashcards]
  );

  const filteredCards = useMemo(() => {
    if (!browseCards.length) return [];

    if (!searchQuery.trim()) return browseCards;
    const query = searchQuery.toLowerCase();
    return browseCards.filter(
      (card) =>
        card.question.toLowerCase().includes(query) ||
        card.answer.toLowerCase().includes(query)
    );
  }, [browseCards, searchQuery]);

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
    setExpandedCards(new Set(filteredCards.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedCards(new Set());
  };

  const allExpanded = filteredCards.length > 0 && filteredCards.every((c) => expandedCards.has(c.id));

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/public/flashcards/${setId}`;
    navigator.clipboard.writeText(shareUrl);
  };

  const handleSaveReference = async () => {
    if (!set) return;
    setSavingAction('reference');
    try {
      await saveReferenceMutation.mutateAsync({ itemType: 'flashcard', itemId: set.id });
      setIsSaveModalOpen(false);
    } catch (error) {
      console.error('Error saving flashcard reference:', error);
    } finally {
      setSavingAction(null);
    }
  };

  const handleSaveCopy = async () => {
    if (!set) return;
    setSavingAction('copy');
    try {
      const result = await copyFlashcardSetMutation.mutateAsync(set.id);
      setIsSaveModalOpen(false);
      router.push(`/flashcards/${result.id}`);
    } catch (error) {
      console.error('Error copying flashcard set:', error);
    } finally {
      setSavingAction(null);
    }
  };

  if (loading) {
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

  if (error || !set) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <ClayCard variant="elevated" padding="lg" className="rounded-3xl text-center">
          <div className="py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <FlashcardIcon className="w-10 h-10 text-primary-light" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Set Not Found</h2>
            <p className="text-foreground-muted mb-8">
              {error || 'This flashcard set is not available for public viewing.'}
            </p>
            <Link href="/community">
              <Button variant="outline">
                <ArrowLeft01Icon className="w-4 h-4 mr-2" />
                Back to Community
              </Button>
            </Link>
          </div>
        </ClayCard>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <ClayCard variant="elevated" padding="md" className="rounded-3xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/community"
              className="p-2 rounded-xl bg-background-muted border border-border hover:bg-background-muted/70 transition-all flex-shrink-0"
              title="Back to community"
            >
              <ArrowLeft01Icon className="w-4 h-4 text-foreground-muted" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                {set.title || 'Flashcards'}
              </h1>
              <p className="text-xs text-foreground-muted mt-0.5">
                {flashcards.length} cards · Shared publicly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsSaveModalOpen(true)}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <Bookmark01Icon className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={copyShareLink}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <Share01Icon className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </div>
      </ClayCard>

      {set.description && (
        <ClayCard variant="default" padding="md" className="rounded-2xl">
          <p className="text-sm text-foreground-muted">{set.description}</p>
        </ClayCard>
      )}

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
            {searchQuery.trim()
              ? 'No cards match your search.'
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

      <p className="text-center text-xs text-foreground-muted/60 pb-4">
        Showing {filteredCards.length} of {flashcards.length} cards
      </p>

      <SaveMaterialModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        itemType="flashcard"
        title={set.title || 'Flashcards'}
        onSaveReference={handleSaveReference}
        onSaveCopy={handleSaveCopy}
        savingAction={savingAction}
      />
    </div>
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
  card: PublicBrowseCard;
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
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface-elevated/30 transition-all"
      >
        <span className="text-xs font-bold text-foreground-muted/40 w-6 text-right flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-relaxed line-clamp-2">
            {card.question}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex-shrink-0 ${statusStyle.bg} ${statusStyle.text}`}
        >
          {statusStyle.label}
        </span>
        <ArrowDown01Icon
          className={`w-4 h-4 text-foreground-muted transition-transform flex-shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-border/30 px-4 pb-4 pt-3 ml-10">
          <p className="text-[10px] uppercase tracking-widest font-bold text-primary-light/60 mb-2">
            Answer
          </p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {card.answer}
          </p>
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

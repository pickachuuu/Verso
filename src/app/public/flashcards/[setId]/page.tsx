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
    <div className="w-full max-w-[90rem] mx-auto pt-8 md:pt-4 pb-20 px-4 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Left Sticky Pane */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 lg:sticky lg:top-8 h-fit z-20">
          
          {/* Hero Header */}
          <div className="w-full flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Link href="/community" className="px-4 py-2 rounded-full border-2 border-border/60 hover:bg-background-muted transition-all hidden sm:flex items-center gap-2">
                <ArrowLeft01Icon className="w-3.5 h-3.5" />
              </Link>
              <div className="w-3 h-3 rounded-full bg-success flex-shrink-0" />
              <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/50">COMMUNITY FLASHCARDS</h1>
            </div>
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-foreground leading-[0.85] break-words uppercase">
              {set.title || 'UNTITLED FLASHCARDS'}
            </h2>
            <p className="text-[12px] font-black uppercase tracking-widest text-foreground/40 mt-2">
              {flashcards.length} CARDS
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <button onClick={() => setIsSaveModalOpen(true)} className="w-full flex justify-center items-center gap-3 px-6 py-4 rounded-[2rem] bg-background-muted hover:bg-border/40 text-foreground font-black uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all">
                <Bookmark01Icon className="w-4 h-4" />
                SAVE SET
              </button>
              <button onClick={copyShareLink} className="w-full flex justify-center items-center gap-3 px-6 py-4 rounded-[2rem] bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[11px] hover:bg-foreground/90 active:scale-95 transition-all shadow-lg">
                <Share01Icon className="w-4 h-4" />
                COPY LINK
              </button>
            </div>
          </div>

          {set.description && (
            <div className="w-full bg-background-muted rounded-[2rem] p-6">
              <p className="text-[13px] font-bold text-foreground/80 leading-relaxed">{set.description}</p>
            </div>
          )}

          {/* Control Strip */}
          <div className="w-full bg-background-muted rounded-[2rem] p-4 flex flex-col gap-3">
            <div className="w-full relative flex items-center bg-surface rounded-[1.5rem] px-5 h-[3.5rem] shadow-sm">
              <Search01Icon className="w-5 h-5 opacity-40 shrink-0" />
              <input
                type="text"
                placeholder="SEARCH..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-[12px] font-black uppercase tracking-widest text-foreground placeholder:text-foreground/30 min-w-0 px-3"
              />
            </div>
            <button
              onClick={allExpanded ? collapseAll : expandAll}
              className="w-full px-6 py-4 rounded-[1.5rem] bg-surface text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:bg-border/40 transition-all shadow-sm"
            >
              {allExpanded ? 'COLLAPSE ALL' : 'EXPAND ALL'}
            </button>
          </div>
        </div>

        {/* Right Scrolling Pane */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[70vh] z-10 w-full lg:pt-8">

      {filteredCards.length === 0 ? (
        <div className="w-full bg-background-muted rounded-[3rem] p-12 text-center border-[6px] border-surface">
          <p className="text-[13px] font-black uppercase tracking-widest text-foreground/50 py-8">
            {searchQuery.trim()
              ? 'NO CARDS MATCH YOUR SEARCH.'
              : 'NO CARDS IN THIS SET.'}
          </p>
        </div>
      ) : (
        <div className="w-full bg-background-muted rounded-[2rem] p-4 lg:p-6 space-y-3">
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

      <p className="text-center text-[10px] font-black uppercase tracking-widest text-foreground/40 pb-4">
        SHOWING {filteredCards.length} OF {flashcards.length} CARDS
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
      </div>
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
    <div className="w-full bg-surface rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border/40 hover:border-border">
      <button
        onClick={onToggle}
        className="w-full flex items-start sm:items-center gap-4 p-5 sm:p-6 text-left hover:bg-surface-elevated/30 transition-all"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30 w-6 text-right flex-shrink-0 pt-0.5 sm:pt-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] sm:text-[14px] font-black tracking-wide text-foreground leading-relaxed line-clamp-3">
            {card.question}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent ${statusStyle.bg} ${statusStyle.text}`}
          >
            {statusStyle.label}
          </span>
          <ArrowDown01Icon
            className={`w-5 h-5 text-foreground/40 transition-transform ${isExpanded ? 'rotate-180' : ''
              }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 sm:px-6 pb-6 pt-3 ml-[3.25rem]">
          <div className="w-12 h-1 bg-border/40 rounded-full mb-5" />
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-3">
            ANSWER
          </p>
          <p className="text-[13px] sm:text-[14px] font-medium text-foreground leading-relaxed whitespace-pre-line text-foreground/90">
            {card.answer}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <span className={`px-4 py-2 rounded-full border border-border/40 bg-background-muted text-[9px] font-black uppercase tracking-widest ${difficultyColor}`}>{difficultyLabel}</span>
            {card.review_count > 0 && (
              <span className="px-4 py-2 rounded-full border border-border/40 bg-background-muted text-[9px] font-black uppercase tracking-widest text-foreground/50">
                {card.review_count} REVIEWS · {card.correct_count} CORRECT
              </span>
            )}
            {card.status === 'mastered' && (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border/40 bg-background-muted text-[9px] text-emerald-500 font-black uppercase tracking-widest">
                <CheckmarkCircle01Icon className="w-3.5 h-3.5" />
                MASTERED
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MobileBottomSheet from '@/component/ui/MobileBottomSheet';
import {
  RefreshIcon,
  Share01Icon,
  Delete01Icon,
  Clock01Icon,
  SparklesIcon,
  Search01Icon,
  FilterIcon,
  SortingAZ01Icon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Loading01Icon,
  MoreVerticalIcon,
} from 'hugeicons-react';
import { FlashcardIcon, FlashcardAddIcon } from '@/component/icons';
import { useFlashcardActions } from '@/hook/useFlashcardActions';
import { FlashcardSet } from '@/lib/database.types';
import ReforgeModal from '@/component/features/modal/ReforgeModal';
import ConfirmDeleteModal from '@/component/features/modal/ConfirmDeleteModal';
import ForgeFlashcardsModal from '@/component/features/modal/ForgeFlashcardsModal';
import FlashcardSetInfoModal from '@/component/features/modal/FlashcardSetInfoModal';
import { GeminiResponse } from '@/lib/gemini';
import {
  useFlashcardSets,
  useSaveGeneratedFlashcards,
  useReforgeFlashcards,
  useDeleteFlashcardSet,
  useTogglePublicStatus
} from '@/hooks/useFlashcards';

type SortOption = 'recent' | 'alphabetical' | 'oldest';
type MasteryFilter = 'all' | 'learning' | 'mastered';

export default function FlashcardDashboardPage() {
  // Modal state
  const [isReforgeModalOpen, setIsReforgeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isForgeModalOpen, setIsForgeModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [existingFlashcards, setExistingFlashcards] = useState<{ question: string; answer: string; difficulty: 'easy' | 'medium' | 'hard' }[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<string | undefined>(undefined);
  const [shareLinkCopied, setShareLinkCopied] = useState<string | null>(null);

  // Filter/Search state
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // TanStack Query hooks
  const { data: flashcardSets = [], isLoading } = useFlashcardSets();
  const saveFlashcardsMutation = useSaveGeneratedFlashcards();
  const reforgeMutation = useReforgeFlashcards();
  const deleteMutation = useDeleteFlashcardSet();
  const togglePublicMutation = useTogglePublicStatus();

  // Keep the old hook for utility functions not yet migrated
  const { getFlashcardsBySet } = useFlashcardActions();

  const saving = saveFlashcardsMutation.isPending || reforgeMutation.isPending;

  // Filter and sort flashcard sets
  const processedSets = useMemo(() => {
    let filtered = [...flashcardSets];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (set) =>
          set.title?.toLowerCase().includes(query) ||
          set.description?.toLowerCase().includes(query)
      );
    }
    if (masteryFilter !== 'all') {
      filtered = filtered.filter((set) => {
        const progress = set.total_cards > 0 ? (set.mastered_cards / set.total_cards) * 100 : 0;
        if (masteryFilter === 'mastered') return progress === 100;
        if (masteryFilter === 'learning') return progress < 100;
        return true;
      });
    }
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
    }
    return filtered;
  }, [flashcardSets, searchQuery, masteryFilter, sortBy]);

  // Stats
  const totalSets = flashcardSets.length;
  const totalCards = flashcardSets.reduce((sum, s) => sum + s.total_cards, 0);
  const masteredSets = flashcardSets.filter((set) => set.total_cards > 0 && set.mastered_cards === set.total_cards).length;
  const sortLabel = sortBy === 'recent' ? 'Most recent' : sortBy === 'alphabetical' ? 'A–Z' : 'Oldest';
  const masteryLabel = masteryFilter === 'all' ? 'All' : masteryFilter === 'learning' ? 'Learning' : 'Mastered';
  const activeFilters = Number(masteryFilter !== 'all');

  const handleCardClick = useCallback((set: FlashcardSet) => {
    setSelectedSet(set);
    setIsInfoModalOpen(true);
  }, []);

  const handleReforgeFlashcards = async (set: FlashcardSet) => {
    setSelectedSet(set);
    try {
      const flashcards = await getFlashcardsBySet(set.id);
      setExistingFlashcards(flashcards.map(f => ({
        question: f.question,
        answer: f.answer,
        difficulty: (f.difficulty_level === 1 ? 'easy' : f.difficulty_level === 3 ? 'hard' : 'medium') as 'easy' | 'medium' | 'hard'
      })));
    } catch (error) {
      console.error('Error fetching existing flashcards:', error);
      setExistingFlashcards([]);
    }
    setIsReforgeModalOpen(true);
  };

  const handleFlashcardsGenerated = async (geminiResponse: GeminiResponse, action: 'add_more' | 'regenerate') => {
    if (!selectedSet) return;
    setSaveSuccess(undefined);
    try {
      await reforgeMutation.mutateAsync({
        setId: selectedSet.id,
        action,
        flashcards: geminiResponse.flashcards
      });
      const actionText = action === 'regenerate' ? 'regenerated' : 'added';
      setSaveSuccess(`Successfully ${actionText} ${geminiResponse.flashcards.length} flashcards!`);
      setTimeout(() => setSaveSuccess(undefined), 3000);
    } catch (error) {
      console.error('Error reforging flashcards:', error);
      setSaveSuccess('Error reforging flashcards. Please try again.');
      setTimeout(() => setSaveSuccess(undefined), 3000);
    }
  };

  const handleCloseReforgeModal = () => {
    setIsReforgeModalOpen(false);
    setSelectedSet(null);
    setExistingFlashcards([]);
  };

  const handleDeleteFlashcardSet = (set: FlashcardSet) => {
    setSelectedSet(set);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSet) return;
    try {
      await deleteMutation.mutateAsync(selectedSet.id);
      setSaveSuccess('Flashcard set deleted successfully!');
      setTimeout(() => setSaveSuccess(undefined), 3000);
    } catch (error) {
      console.error('Error deleting flashcard set:', error);
      setSaveSuccess('Error deleting flashcard set. Please try again.');
      setTimeout(() => setSaveSuccess(undefined), 3000);
    }
  };

  const handleForgeFlashcards = async (
    geminiResponse: GeminiResponse,
    noteIds: string[],
    setTitle: string
  ) => {
    try {
      await saveFlashcardsMutation.mutateAsync({
        noteId: noteIds.length === 1 ? noteIds[0] : undefined,
        noteTitle: setTitle,
        difficulty: 'medium',
        geminiResponse,
      });
      setSaveSuccess(`Successfully created ${geminiResponse.flashcards.length} flashcards!`);
      setTimeout(() => setSaveSuccess(undefined), 3000);
    } catch (error) {
      console.error('Error saving flashcards:', error);
      setSaveSuccess('Error saving flashcards. Please try again.');
      setTimeout(() => setSaveSuccess(undefined), 3000);
    } finally {
      setIsForgeModalOpen(false);
    }
  };

  const handleCopyShareLink = async (set: FlashcardSet, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!set.is_public) {
      try {
        await togglePublicMutation.mutateAsync({ setId: set.id, isPublic: true });
      } catch (error) {
        console.error('Error making set public:', error);
        return;
      }
    }
    const shareUrl = `${window.location.origin}/public/flashcards/${set.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareLinkCopied(set.id);
      setTimeout(() => setShareLinkCopied(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Handle auth errors
  if (flashcardSets === undefined && !isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto pt-8 md:pt-4 pb-20 space-y-10 px-2 md:px-0">
        <FlashcardsHeader totalSets={0} totalCards={0} onCreateNew={() => setIsForgeModalOpen(true)} />
        <div className="bg-foreground text-surface rounded-[3rem] p-12 text-center">
          <h3 className="text-3xl font-black uppercase tracking-tight mb-4">ERROR LOADING</h3>
          <p className="opacity-70 mb-8 max-w-md mx-auto text-base leading-relaxed font-bold">
            There was an error loading your flashcard sets.
          </p>
          <button className="px-8 py-4 bg-surface text-foreground rounded-full font-black uppercase tracking-[0.2em] text-[12px] hover:bg-surface-elevated transition-all active:scale-95">
            RETRY NOW
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto pt-8 md:pt-4 pb-20 space-y-10 lg:space-y-14 px-2 md:px-0">
        
        {/* Massive Hero Header */}
        <FlashcardsHeader totalSets={totalSets} totalCards={totalCards} onCreateNew={() => setIsForgeModalOpen(true)} />

        {/* Global Toast */}
        {saveSuccess && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4">
            <div className={`px-8 py-4 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex items-center gap-3 ${
              saveSuccess.includes('Error') ? 'bg-[#ff3b30] text-white' : 'bg-foreground text-surface'
            }`}>
              <SparklesIcon className="w-5 h-5 flex-shrink-0" />
              <p className="text-[12px] font-black uppercase tracking-widest">{saveSuccess}</p>
            </div>
          </div>
        )}

        {/* MOBILE CONTROLS */}
        <div className="lg:hidden flex flex-col gap-4 w-full text-foreground relative z-20">
          <div className="flex w-full items-stretch gap-3 h-[3.5rem]">
            <div className="flex-1 bg-background-muted rounded-[2rem] flex items-center px-5 gap-3 min-w-0">
              <Search01Icon className="w-5 h-5 opacity-40 shrink-0" />
              <input
                type="text"
                placeholder="SEARCH SETS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-[12px] font-black uppercase tracking-widest text-foreground placeholder:text-foreground/30 min-w-0"
              />
            </div>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="w-[3.5rem] h-[3.5rem] shrink-0 bg-foreground text-surface rounded-[2rem] flex items-center justify-center active:scale-95 transition-transform relative"
            >
              <FilterIcon className="w-5 h-5" />
              {activeFilters > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-[#ff3b30] rounded-full border-2 border-foreground" />}
            </button>
          </div>
          <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
            <span>SHOWING {processedSets.length} SET{processedSets.length !== 1 ? 'S' : ''}</span>
            <span>{masteryLabel} / {sortLabel}</span>
          </div>
        </div>

        {/* DESKTOP INLINE TOOLBAR */}
        <div className="hidden lg:flex flex-col gap-5 w-full relative z-20">
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 bg-background-muted rounded-[1.5rem] flex items-center px-5 gap-3 h-[3.25rem]">
              <Search01Icon className="w-5 h-5 opacity-40 shrink-0" />
              <input
                type="text"
                placeholder="SEARCH FLASHCARD SETS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-[12px] font-black uppercase tracking-widest text-foreground placeholder:text-foreground/30 min-w-0"
              />
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <div className="bg-foreground text-surface px-5 h-[3.25rem] rounded-[1.5rem] flex items-center gap-2">
                <span className="text-[22px] font-black tracking-tighter leading-none">{processedSets.length}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">SETS</span>
              </div>
              <div className="bg-background-muted px-5 h-[3.25rem] rounded-[1.5rem] flex items-center gap-2">
                <span className="text-[22px] font-black tracking-tighter leading-none text-foreground">{totalCards}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">CARDS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mr-1">MASTERY</span>
              {[
                { id: 'all', label: 'ALL' },
                { id: 'learning', label: 'LEARNING' },
                { id: 'mastered', label: 'MASTERED' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setMasteryFilter(opt.id as MasteryFilter)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    masteryFilter === opt.id ? 'bg-foreground text-surface shadow-md' : 'bg-background-muted text-foreground hover:bg-border/40'
                  }`}
                >{opt.label}</button>
              ))}
            </div>

            <div className="w-px h-6 bg-foreground/10 mx-1" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mr-1">SORT</span>
              {[
                { id: 'recent', label: 'RECENT' },
                { id: 'alphabetical', label: 'A–Z' },
                { id: 'oldest', label: 'OLDEST' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as SortOption)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    sortBy === opt.id ? 'bg-foreground text-surface shadow-md' : 'bg-background-muted text-foreground hover:bg-border/40'
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="w-full relative z-10">
          {isLoading ? (
            <FlashcardsSkeleton />
          ) : processedSets.length === 0 ? (
            <EmptyState
              hasFilters={searchQuery.trim() !== '' || masteryFilter !== 'all'}
              onClearFilters={() => { setSearchQuery(''); setMasteryFilter('all'); }}
              onCreateNew={() => setIsForgeModalOpen(true)}
              totalSets={totalSets}
            />
          ) : (
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {processedSets.map((set) => (
                <FlashcardListItem
                  key={set.id}
                  set={set}
                  onClick={() => handleCardClick(set)}
                  onReforge={() => handleReforgeFlashcards(set)}
                  onDelete={() => handleDeleteFlashcardSet(set)}
                  onShare={(e) => handleCopyShareLink(set, e)}
                  shareLinkCopied={shareLinkCopied === set.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==============================================
          MOBILE BOTTOM SHEET FILTERS
      ============================================== */}
      <MobileBottomSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="REFINE SEARCH"
        description="FILTER YOUR STUDY DECKS"
        footer={(
          <div className="flex gap-3 w-full p-2">
            <button
              onClick={() => { setMasteryFilter('all'); setSortBy('recent'); }}
              className="flex-1 py-4 rounded-[2rem] bg-background-muted text-foreground font-black uppercase tracking-[0.2em] text-[12px] hover:bg-border/40 active:scale-95 transition-all"
            >
              RESET
            </button>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="flex-[2] py-4 rounded-[2rem] bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.2)] active:scale-95 transition-all"
            >
              APPLY FILTERS
            </button>
          </div>
        )}
      >
        <div className="space-y-10 pt-4 pb-6 px-1">
          {/* Mastery */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 mb-5">MASTERY LEVEL</div>
            <div className="flex flex-col gap-3">
              {[
                { id: 'all', label: 'ALL SETS', icon: <FlashcardIcon className="w-5 h-5" /> },
                { id: 'learning', label: 'LEARNING', icon: <Loading01Icon className="w-5 h-5" /> },
                { id: 'mastered', label: 'MASTERED', icon: <CheckmarkCircle01Icon className="w-5 h-5" /> },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setMasteryFilter(opt.id as MasteryFilter)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-[2rem] transition-all shadow-sm ${
                    masteryFilter === opt.id ? 'bg-foreground text-surface' : 'bg-background-muted text-foreground'
                  }`}
                >
                  {opt.icon}
                  <span className="text-[12px] font-black uppercase tracking-widest">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 mb-5">SORT ORDER</div>
            <div className="flex flex-col gap-3">
              {[
                { id: 'recent', label: 'MOST RECENT', icon: <Clock01Icon className="w-5 h-5" /> },
                { id: 'alphabetical', label: 'ALPHABETICAL (A-Z)', icon: <SortingAZ01Icon className="w-5 h-5" /> },
                { id: 'oldest', label: 'OLDEST ARCHIVES', icon: <Calendar03Icon className="w-5 h-5" /> },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as SortOption)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-[2rem] transition-all shadow-sm ${
                    sortBy === opt.id ? 'bg-foreground text-surface' : 'bg-background-muted text-foreground'
                  }`}
                >
                  {opt.icon}
                  <span className="text-[12px] font-black uppercase tracking-widest">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </MobileBottomSheet>

      {/* ==============================================
          MODALS
      ============================================== */}
      <ReforgeModal isOpen={isReforgeModalOpen} onClose={handleCloseReforgeModal} noteContent={selectedSet?.description || ''} existingFlashcards={existingFlashcards} onFlashcardsGenerated={handleFlashcardsGenerated} saving={saving} />
      <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="DELETE FLASHCARD SET" description="Are you absolutely sure you want to permanently delete this flashcard set? This action cannot be undone." itemName={selectedSet?.title || 'Untitled Set'} itemType="flashcard set" />
      <ForgeFlashcardsModal isOpen={isForgeModalOpen} onClose={() => setIsForgeModalOpen(false)} onFlashcardsGenerated={handleForgeFlashcards} saving={saving} />
      <FlashcardSetInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} set={selectedSet} />
    </>
  );
}

// ============================================
// Components
// ============================================

function FlashcardsHeader({
  totalSets,
  totalCards,
  onCreateNew,
}: {
  totalSets: number;
  totalCards: number;
  onCreateNew: () => void;
}) {
  return (
    <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pb-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-2 md:mb-3">
          <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
          <h1 className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.3em] text-foreground/50">YOUR STUDY DECKS</h1>
        </div>
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-foreground leading-[0.85]">
          FLASHCARDS
        </h2>
      </div>

      <div className="flex shrink-0 w-full md:w-auto pb-1 mt-2 md:mt-0">
        <button
          onClick={onCreateNew}
          className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-[2rem] bg-foreground text-surface hover:bg-foreground/90 transition-all font-black uppercase tracking-[0.2em] text-[12px] shadow-lg active:scale-95"
        >
          <FlashcardAddIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          FORGE FLASHCARDS
        </button>
      </div>
    </div>
  );
}

function FlashcardsSkeleton() {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="w-full bg-background-muted rounded-[2rem] p-5 lg:p-6 flex items-start gap-4 lg:gap-5 animate-pulse relative"
        >
          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[1rem] flex-shrink-0 bg-foreground/10" />
          <div className="flex-1 min-w-0 flex flex-col justify-center pr-8 lg:pr-10 gap-2">
            <div className="h-4 lg:h-5 w-3/4 bg-foreground/5 rounded-full" />
            <div className="h-3 w-1/2 bg-foreground/5 rounded-full" />
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <div className="h-5 w-20 bg-foreground/5 rounded-[0.75rem]" />
              <div className="h-5 w-16 bg-foreground/5 rounded-[0.75rem]" />
              <div className="h-5 w-20 bg-foreground/5 rounded-[0.75rem]" />
            </div>
            <div className="flex items-center gap-3 w-full mt-1">
              <div className="flex-1 h-2 bg-foreground/5 rounded-full" />
              <div className="h-3 w-8 bg-foreground/5 rounded-full" />
            </div>
          </div>
          <div className="absolute top-4 right-4 lg:top-5 lg:right-5">
            <div className="w-10 h-10 bg-foreground/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters, onClearFilters, onCreateNew, totalSets

}: {
  hasFilters: boolean; onClearFilters: () => void; onCreateNew: () => void; totalSets: number;
}) {
  return (
    <div className="w-full bg-background-muted rounded-[3rem] p-10 lg:p-20 text-center flex flex-col items-center border-[6px] border-surface">
      <div className="w-40 h-40 mb-10 relative opacity-90 drop-shadow-xl saturate-50">
        <Image src="/brand/verso-empty-clean.svg" alt="Empty" fill className="object-contain" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-foreground mb-4">NO MATCHES</h3>
          <p className="opacity-60 mb-10 text-[13px] max-w-md font-bold uppercase tracking-widest leading-relaxed">
            NOTHING FOUND FOR YOUR CURRENT SEARCH OR MASTERY FILTERS.
          </p>
          <button onClick={onClearFilters} className="px-10 py-4 rounded-full bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] hover:scale-105 transition-all shadow-[0_12px_30px_rgba(0,0,0,0.15)]">
            CLEAR ALL FILTERS
          </button>
        </>
      ) : totalSets === 0 ? (
        <>
          <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-foreground mb-4">BLANK SLATE</h3>
          <p className="opacity-60 mb-10 text-[13px] max-w-md font-bold uppercase tracking-widest leading-relaxed">
            CREATE YOUR FIRST FLASHCARD SET FROM YOUR NOTES TO BEGIN STUDYING.
          </p>
          <button
            onClick={onCreateNew}
            className="group flex items-center justify-center gap-3 px-8 py-4 rounded-[2rem] bg-foreground text-surface hover:bg-foreground/90 transition-all font-black uppercase tracking-[0.2em] text-[12px] shadow-lg active:scale-95"
          >
            <FlashcardAddIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            FORGE FLASHCARDS
          </button>
        </>
      ) : (
        <>
          <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-foreground mb-4">NO RESULTS</h3>
          <p className="opacity-60 mb-10 text-[13px] max-w-md font-bold uppercase tracking-widest leading-relaxed">
            NO FLASHCARD SETS MATCH YOUR CURRENT FILTERS.
          </p>
          <button onClick={onClearFilters} className="px-10 py-4 rounded-full bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] hover:scale-105 transition-all shadow-[0_12px_30px_rgba(0,0,0,0.15)]">
            CLEAR FILTERS
          </button>
        </>
      )}
    </div>
  );
}

function FlashcardListItem({
  set, onClick, onReforge, onDelete, onShare, shareLinkCopied,
}: {
  set: FlashcardSet; onClick: () => void; onReforge: () => void; onDelete: () => void; onShare: (e: React.MouseEvent) => void; shareLinkCopied: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const progress = Math.round((set.mastered_cards / set.total_cards) * 100) || 0;
  const isMastered = progress === 100;
  const learningCards = set.total_cards - set.mastered_cards;

  // Mastery-based color for the icon
  const getMasteryColor = () => {
    if (isMastered) return '#10b981';
    if (progress >= 50) return '#f59e0b';
    if (progress > 0) return '#6366f1';
    return '#94a3b8';
  };

  const getMasteryBadge = () => {
    if (isMastered) return { text: 'MASTERED', cls: 'bg-[#10b981] text-white' };
    if (progress >= 50) return { text: 'IN PROGRESS', cls: 'bg-[#f59e0b] text-white' };
    if (progress > 0) return { text: 'LEARNING', cls: 'bg-[#6366f1] text-white' };
    return { text: 'NEW', cls: 'bg-foreground/10 text-foreground' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const sourceNote = (set as FlashcardSet & { notes?: { id: string; title: string } | null }).notes;
  const masteryBadge = getMasteryBadge();

  return (
    <div
      onClick={onClick}
      className={`group relative w-full bg-background-muted rounded-[2rem] p-5 lg:p-6 flex items-start gap-4 lg:gap-5 cursor-pointer transition-all hover:bg-surface-elevated shadow-sm hover:shadow-xl hover:-translate-y-1 ${isMenuOpen ? 'z-50' : 'z-10'}`}
    >
      {/* Flat mastery icon block */}
      <div
        className="w-14 h-14 lg:w-16 lg:h-16 rounded-[1rem] flex-shrink-0 flex items-center justify-center shadow-inner relative overflow-hidden"
        style={{ background: getMasteryColor() }}
      >
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
        <FlashcardIcon className="w-7 h-7 lg:w-8 lg:h-8 text-white relative z-10 drop-shadow-md" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center pr-8 lg:pr-10">
        <h3 className="text-[14px] lg:text-[16px] font-black uppercase tracking-widest text-foreground truncate max-w-[95%] leading-tight mb-2">
          {set.title || 'UNTITLED SET'}
        </h3>

        {sourceNote && (
          <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-foreground/40 truncate mb-2">
            FROM {sourceNote.title}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] border-2 border-border/80 text-foreground-muted text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none bg-surface/50">
            <Clock01Icon className="w-3.5 h-3.5 opacity-70" /> {formatDate(set.updated_at || set.created_at)}
          </span>
          <span className="inline-flex px-3 py-1.5 rounded-[0.75rem] border-2 border-border/80 text-foreground-muted text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none bg-surface/50">
            {set.total_cards} CARDS
          </span>
          <span className={`inline-flex px-3 py-1.5 rounded-[0.75rem] text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none shadow-sm ${masteryBadge.cls}`}>
            {masteryBadge.text}
          </span>
          {set.is_public && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-[#00c569] text-white text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none shadow-sm">
              PUBLIC
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 bg-border/30 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: getMasteryColor() }}
            />
          </div>
          <span className="text-[10px] font-black text-foreground/60 shrink-0 w-8 text-right">{progress}%</span>
        </div>
      </div>

      {/* 3-Dot Dropdown */}
      <div className="absolute top-4 right-4 lg:top-5 lg:right-5 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
          className={`p-2.5 rounded-full transition-all shadow-sm ${
            isMenuOpen ? 'bg-foreground text-surface' : 'bg-surface/80 backdrop-blur-md text-foreground hover:bg-foreground hover:text-surface'
          }`}
        >
          <MoreVerticalIcon className="w-5 h-5" />
        </button>

        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} />
            <div className="absolute top-full right-0 mt-2 w-[11rem] lg:w-[12rem] bg-surface rounded-[1.25rem] shadow-2xl p-2 flex flex-col gap-1.5 border-2 border-border/20 z-50 origin-top-right animate-in zoom-in-95 duration-100">
              
              <button
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[0.75rem] transition-all w-full text-left ${
                  shareLinkCopied ? 'bg-[#00c569] text-white cursor-default shadow-sm' : 'hover:bg-background-muted text-foreground'
                }`}
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onShare(e); }}
              >
                <Share01Icon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{shareLinkCopied ? 'COPIED!' : 'SHARE LINK'}</span>
              </button>

              <button
                className="flex items-center gap-3 px-3 py-2.5 rounded-[0.75rem] hover:bg-background-muted text-foreground transition-all w-full text-left"
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onReforge(); }}
              >
                <RefreshIcon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">REFORGE</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onDelete(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[0.75rem] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] text-[#ff3b30] transition-all w-full text-left"
              >
                <Delete01Icon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">DELETE</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

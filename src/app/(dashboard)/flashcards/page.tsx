'use client';

import { useState, useCallback, useMemo } from 'react';
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
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
  Loading01Icon
} from 'hugeicons-react';
import { FlashcardIcon, FlashcardAddIcon } from '@/component/icons';
import HeroActionButton from '@/component/ui/HeroActionButton';
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

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (set) =>
          set.title?.toLowerCase().includes(query) ||
          set.description?.toLowerCase().includes(query)
      );
    }

    // Mastery filter
    if (masteryFilter !== 'all') {
      filtered = filtered.filter((set) => {
        const progress = set.total_cards > 0 ? (set.mastered_cards / set.total_cards) * 100 : 0;
        if (masteryFilter === 'mastered') return progress === 100;
        if (masteryFilter === 'learning') return progress < 100;
        return true;
      });
    }

    // Sort
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
      <div className="space-y-6">
        <FlashcardsHeader totalSets={0} totalCards={0} onCreateNew={() => setIsForgeModalOpen(true)} />
        <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
              <FlashcardIcon className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Error loading flashcards</h3>
            <p className="text-foreground-muted mb-6">
              There was an error loading your flashcard sets. Please try again.
            </p>
          </div>
        </ClayCard>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Hero Header */}
        <FlashcardsHeader
          totalSets={totalSets}
          totalCards={totalCards}
          onCreateNew={() => setIsForgeModalOpen(true)}
        />

        {/* Success/Error Message */}
        {saveSuccess && (
          <div
            className={`px-4 py-3 rounded-xl border-2 transition-all ${
              saveSuccess.includes('Error')
                ? 'border-red-200 bg-red-50'
                : 'border-green-200 bg-green-50'
            }`}
          >
            <p className={`text-sm font-semibold ${
              saveSuccess.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}>
              {saveSuccess}
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main content */}
          <div className="order-2 lg:order-1 lg:col-span-8 space-y-4">
          {/* Mobile controls */}
          <div className="lg:hidden space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface border border-border">
                <Search01Icon className="w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search flashcard sets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none text-sm text-foreground placeholder:text-foreground-muted"
                />
              </div>
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground hover:bg-background-muted transition-colors"
              >
                <FilterIcon className="w-4 h-4 text-foreground-muted" />
                Filters
                {activeFilters > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold bg-background-muted text-foreground">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>Showing {processedSets.length} set{processedSets.length !== 1 ? 's' : ''}</span>
              <span>{masteryLabel} · {sortLabel}</span>
            </div>
          </div>

            {isLoading ? (
              <FlashcardsSkeleton />
            ) : processedSets.length === 0 ? (
              <EmptyState
                hasFilters={searchQuery.trim() !== '' || masteryFilter !== 'all'}
                onClearFilters={() => {
                  setSearchQuery('');
                  setMasteryFilter('all');
                }}
                onCreateNew={() => setIsForgeModalOpen(true)}
                totalSets={totalSets}
              />
            ) : (
              <>
                {/* Results count */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground-muted">
                    Showing <span className="font-semibold text-foreground">{processedSets.length}</span> set{processedSets.length !== 1 ? 's' : ''}
                    {(searchQuery || masteryFilter !== 'all') && (
                      <span> matching your filters</span>
                    )}
                  </p>
                </div>

                {/* Flashcard Sets List */}
                <div className="space-y-3">
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
              </>
            )}
          </div>

          {/* Sidebar controls */}
          <div className="order-1 lg:order-2 lg:col-span-4 space-y-4 hidden lg:block">
            <ClayCard variant="default" padding="md" className="rounded-2xl">
              <div className="flex items-center gap-2">
                <Search01Icon className="w-5 h-5 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search flashcard sets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-foreground-muted"
                />
              </div>
            </ClayCard>

            <ClayCard variant="default" padding="md" className="rounded-2xl">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-2">
                    <FilterIcon className="w-4 h-4" />
                    Mastery
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-background-muted border border-border">
                    <button
                      onClick={() => setMasteryFilter('all')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        masteryFilter === 'all'
                          ? 'bg-surface text-foreground shadow-sm'
                          : 'text-foreground-muted hover:text-foreground'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setMasteryFilter('learning')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                        masteryFilter === 'learning'
                          ? 'bg-surface text-foreground shadow-sm'
                          : 'text-foreground-muted hover:text-foreground'
                      }`}
                    >
                      <Loading01Icon className="w-3 h-3" />
                      Learning
                    </button>
                    <button
                      onClick={() => setMasteryFilter('mastered')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                        masteryFilter === 'mastered'
                          ? 'bg-surface text-foreground shadow-sm'
                          : 'text-foreground-muted hover:text-foreground'
                      }`}
                    >
                      <CheckmarkCircle01Icon className="w-3 h-3" />
                      Mastered
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-2">
                    <SortingAZ01Icon className="w-4 h-4" />
                    Sort
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-background-muted border border-border">
                    <button
                      onClick={() => setSortBy('recent')}
                      className={`p-2 rounded-md transition-all ${
                        sortBy === 'recent'
                          ? 'bg-surface text-primary shadow-sm'
                          : 'text-foreground-muted hover:text-foreground'
                      }`}
                      title="Sort by recent"
                    >
                      <Clock01Icon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSortBy('alphabetical')}
                      className={`p-2 rounded-md transition-all ${
                        sortBy === 'alphabetical'
                          ? 'bg-surface text-primary shadow-sm'
                          : 'text-foreground-muted hover:text-foreground'
                      }`}
                      title="Sort alphabetically"
                    >
                      <SortingAZ01Icon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSortBy('oldest')}
                      className={`p-2 rounded-md transition-all ${
                        sortBy === 'oldest'
                          ? 'bg-surface text-primary shadow-sm'
                          : 'text-foreground-muted hover:text-foreground'
                      }`}
                      title="Sort by oldest"
                    >
                      <Calendar03Icon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </ClayCard>

            <ClayCard variant="default" padding="md" className="rounded-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground-muted">Sets</p>
                  <p className="text-2xl font-bold text-foreground">{totalSets}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground-muted">Cards</p>
                  <p className="text-2xl font-bold text-foreground">{totalCards}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-wide text-foreground-muted">Mastered sets</p>
                  <p className="text-lg font-semibold text-foreground">{masteredSets}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-foreground-muted">
                {masteryLabel} · {sortLabel}
              </div>
            </ClayCard>
          </div>
        </div>
      </div>

      <MobileBottomSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filters"
        description="Refine your flashcards"
        footer={(
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMasteryFilter('all');
                setSortBy('recent');
              }}
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-background-muted transition-all"
            >
              Reset
            </button>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="flex-1 px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Done
            </button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <FilterIcon className="w-4 h-4" />
              Mastery
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setMasteryFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  masteryFilter === 'all'
                    ? 'bg-background-muted text-foreground border border-border'
                    : 'text-foreground-muted border border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMasteryFilter('learning')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                  masteryFilter === 'learning'
                    ? 'bg-background-muted text-foreground border border-border'
                    : 'text-foreground-muted border border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                <Loading01Icon className="w-3 h-3" />
                Learning
              </button>
              <button
                onClick={() => setMasteryFilter('mastered')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                  masteryFilter === 'mastered'
                    ? 'bg-background-muted text-foreground border border-border'
                    : 'text-foreground-muted border border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                <CheckmarkCircle01Icon className="w-3 h-3" />
                Mastered
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <SortingAZ01Icon className="w-4 h-4" />
              Sort
            </div>
            <div className="mt-2 flex items-center gap-1 p-1 rounded-lg bg-background-muted border border-border">
              <button
                onClick={() => setSortBy('recent')}
                className={`p-2 rounded-md transition-all ${
                  sortBy === 'recent'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="Sort by recent"
              >
                <Clock01Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSortBy('alphabetical')}
                className={`p-2 rounded-md transition-all ${
                  sortBy === 'alphabetical'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="Sort alphabetically"
              >
                <SortingAZ01Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSortBy('oldest')}
                className={`p-2 rounded-md transition-all ${
                  sortBy === 'oldest'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="Sort by oldest"
              >
                <Calendar03Icon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background-muted p-3 text-xs text-foreground-muted">
            <div className="flex items-center justify-between">
              <span>Sets</span>
              <span className="font-semibold text-foreground">{totalSets}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Cards</span>
              <span className="font-semibold text-foreground">{totalCards}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Mastered</span>
              <span className="font-semibold text-foreground">{masteredSets}</span>
            </div>
            <div className="mt-2 text-[11px]">{masteryLabel} · {sortLabel}</div>
          </div>
        </div>
      </MobileBottomSheet>

      <ReforgeModal
        isOpen={isReforgeModalOpen}
        onClose={handleCloseReforgeModal}
        noteContent={selectedSet?.description || ''}
        existingFlashcards={existingFlashcards}
        onFlashcardsGenerated={handleFlashcardsGenerated}
        saving={saving}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Flashcard Set"
        description="Are you sure you want to delete this flashcard set? This action cannot be undone."
        itemName={selectedSet?.title || 'Untitled Set'}
        itemType="flashcard set"
      />

      <ForgeFlashcardsModal
        isOpen={isForgeModalOpen}
        onClose={() => setIsForgeModalOpen(false)}
        onFlashcardsGenerated={handleForgeFlashcards}
        saving={saving}
      />

      <FlashcardSetInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        set={selectedSet}
      />
    </>
  );
}

// ============================================
// Sub-components
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
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Title area */}
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-2xl bg-background-muted border border-border">
            <FlashcardIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Flashcards
              </h1>
              <ClayBadge variant="accent" className="text-xs px-2 py-1">
                <SparklesIcon className="w-3 h-3" />
                {totalSets} sets &middot; {totalCards} cards
              </ClayBadge>
            </div>
            <p className="text-foreground-muted">
              Study with AI-generated interactive flashcards
            </p>
          </div>
        </div>

        {/* CTA */}
        <HeroActionButton
          icon={<FlashcardAddIcon className="w-5 h-5" />}
          onClick={onCreateNew}
        >
          Forge Flashcards
        </HeroActionButton>
      </div>
    </ClayCard>
  );
}

function FlashcardsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <ClayCard key={i} variant="default" padding="none" className="rounded-2xl overflow-hidden animate-pulse">
          <div className="flex items-stretch">
            <div className="w-1 bg-background-muted" />
            <div className="flex items-center gap-4 p-3 pr-5 flex-1">
              <div className="w-14 h-12 bg-background-muted rounded-lg" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-2/3 bg-background-muted rounded" />
                <div className="h-3 w-1/2 bg-background-muted/80 rounded" />
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-2.5 w-20 bg-background-muted/70 rounded" />
                  <div className="h-2.5 w-16 bg-background-muted/70 rounded" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-8 w-8 bg-background-muted rounded-lg" />
                <div className="h-8 w-8 bg-background-muted rounded-lg" />
              </div>
            </div>
          </div>
        </ClayCard>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
  onCreateNew,
  totalSets
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateNew: () => void;
  totalSets: number;
}) {
  return (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
      <div className="text-center py-16">
        <div className="w-28 h-28 mx-auto mb-8 rounded-3xl bg-background-muted border border-border flex items-center justify-center">
          <FlashcardIcon className="w-14 h-14 text-primary" />
        </div>

        {hasFilters ? (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">No matching flashcard sets</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Try adjusting your search or filters to find what you&apos;re looking for
            </p>
            <button
              onClick={onClearFilters}
              className="px-6 py-3 rounded-xl bg-surface text-foreground font-semibold border border-border hover:shadow-md transition-all"
            >
              Clear filters
            </button>
          </>
        ) : totalSets === 0 ? (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">Start studying with flashcards</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Create flashcards from your notes to begin studying with spaced repetition
            </p>
            <HeroActionButton
              icon={<FlashcardAddIcon className="w-5 h-5" />}
              onClick={onCreateNew}
            >
              Forge Flashcards
            </HeroActionButton>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">No results found</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              No flashcard sets match your current filters
            </p>
            <button
              onClick={onClearFilters}
              className="px-6 py-3 rounded-xl bg-surface text-foreground font-semibold border border-border hover:shadow-md transition-all"
            >
              Clear filters
            </button>
          </>
        )}
      </div>
    </ClayCard>
  );
}

function FlashcardListItem({
  set,
  onClick,
  onReforge,
  onDelete,
  onShare,
  shareLinkCopied,
}: {
  set: FlashcardSet;
  onClick: () => void;
  onReforge: () => void;
  onDelete: () => void;
  onShare: (e: React.MouseEvent) => void;
  shareLinkCopied: boolean;
}) {
  const progress = Math.round((set.mastered_cards / set.total_cards) * 100) || 0;
  const isMastered = progress === 100;
  const learningCards = set.total_cards - set.mastered_cards;

  // Choose accent colors based on mastery
  const accentColor = isMastered ? '#10b981' : '#6366f1';
  const accentColorLight = isMastered ? '#34d399' : '#818cf8';
  const accentShadow = isMastered ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)';

  // Mastery status label
  const getMasteryLabel = () => {
    if (isMastered) return { text: 'Mastered', className: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
    if (progress >= 50) return { text: 'In Progress', className: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
    if (progress > 0) return { text: 'Learning', className: 'text-primary bg-primary/10 border-primary/20' };
    return { text: 'New', className: 'text-foreground-muted bg-surface border-border/50' };
  };

  const masteryLabel = getMasteryLabel();

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

  // Get the source note name from the set metadata
  const sourceNote = (set as FlashcardSet & { notes?: { id: string; title: string } | null }).notes;

  return (
    <div onClick={onClick} className="block group cursor-pointer">
      <ClayCard variant="default" padding="none" className="rounded-2xl overflow-hidden hover:shadow-lg transition-all">
        <div className="flex items-stretch">
          {/* Mastery accent left border */}
          <div
            className="w-1 flex-shrink-0 rounded-l-2xl"
            style={{
              background: isMastered
                ? 'linear-gradient(180deg, #34d399, #10b981)'
                : progress >= 50
                  ? 'linear-gradient(180deg, #fbbf24, #f59e0b)'
                  : progress > 0
                    ? 'linear-gradient(180deg, #818cf8, #6366f1)'
                    : 'linear-gradient(180deg, #94a3b8, #64748b)'
            }}
          />

          <div className="flex items-center gap-4 p-3 pr-5 flex-1 min-w-0">
            {/* 3D mini flashcard stack */}
            <div className="relative flex-shrink-0" style={{ width: 56, height: 44 }}>
              {/* Bottom card (3rd in stack) — offset right + down */}
              <div
                className="absolute rounded-[6px]"
                style={{
                  top: 4,
                  left: 4,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, #d1d5db, #c4c8cd)',
                  boxShadow: '1px 1px 2px rgba(0,0,0,0.10)',
                }}
              />
              {/* Middle card (2nd in stack) */}
              <div
                className="absolute rounded-[6px]"
                style={{
                  top: 2,
                  left: 2,
                  right: 2,
                  bottom: 2,
                  background: 'linear-gradient(135deg, #e2e5ea, #d5d8dd)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                }}
              />
              {/* Front card — main colored card */}
              <div
                className="absolute rounded-[6px] overflow-hidden"
                style={{
                  top: 0,
                  left: 0,
                  right: 4,
                  bottom: 4,
                  background: `linear-gradient(145deg, ${accentColorLight} 0%, ${accentColor} 60%, ${accentColor} 100%)`,
                  boxShadow: `2px 3px 6px ${accentShadow}`,
                }}
              >
                {/* Glossy highlight */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: '-15%',
                    left: '5%',
                    right: '35%',
                    bottom: '55%',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                    borderRadius: '50%',
                    filter: 'blur(1px)',
                  }}
                />
                {/* Divider line (Q/A split) */}
                <div
                  className="absolute left-[15%] right-[15%]"
                  style={{
                    top: '50%',
                    height: 1,
                    background: 'rgba(255,255,255,0.3)',
                  }}
                />
                {/* Lightning bolt icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {set.title}
                </h3>
                {set.is_public && (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                    Public
                  </span>
                )}
                <span className={`hidden sm:inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${masteryLabel.className}`}>
                  {masteryLabel.text}
                </span>
              </div>
              {/* Source note */}
              {sourceNote && (
                <p className="text-[11px] text-foreground-muted/70 truncate mt-0.5">
                  From: {sourceNote.title}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-foreground-muted flex items-center gap-1">
                  <Clock01Icon className="w-3 h-3" />
                  {formatDate(set.updated_at || set.created_at)}
                </span>
                <span className="text-xs text-foreground-muted">
                  <span className="font-medium text-foreground">{set.total_cards}</span> cards
                </span>
                {learningCards > 0 && !isMastered && (
                  <span className="text-xs text-foreground-muted">
                    <span className="font-medium text-primary">{learningCards}</span> to learn
                  </span>
                )}
                {/* Mini progress bar */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="w-20 bg-surface rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMastered ? 'bg-emerald-400' : progress >= 50 ? 'bg-amber-400' : 'bg-primary/70'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${isMastered ? 'text-emerald-600' : 'text-foreground-muted'}`}>{progress}%</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                className={`p-2 rounded-lg transition-colors ${
                  shareLinkCopied
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
                title={shareLinkCopied ? 'Copied!' : 'Share'}
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(e);
                }}
              >
                <Share01Icon className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReforge();
                }}
                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                title="Reforge flashcards"
              >
                <RefreshIcon className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                title="Delete set"
              >
                <Delete01Icon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </ClayCard>
    </div>
  );
}

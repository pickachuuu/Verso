'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ClayCard } from '@/component/ui/Clay';
import {
  RefreshIcon,
  Share01Icon,
  Delete01Icon,
  Clock01Icon,
  SparklesIcon,
  Search01Icon,
  FilterIcon,
  GridViewIcon,
  Menu01Icon,
  SortingAZ01Icon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Loading01Icon
} from 'hugeicons-react';
import { FlashcardIcon, FlashcardAddIcon } from '@/component/icons';
import HeroActionButton from '@/component/ui/HeroActionButton';
import CardsDueToday from '@/component/features/CardsDueToday';
import MasteryProgress from '@/component/features/MasteryProgress';
import { useFlashcardActions } from '@/hook/useFlashcardActions';
import { FlashcardSet } from '@/lib/database.types';
import ReforgeModal from '@/component/features/modal/ReforgeModal';
import ConfirmDeleteModal from '@/component/features/modal/ConfirmDeleteModal';
import ForgeFlashcardsModal from '@/component/features/modal/ForgeFlashcardsModal';
import { GeminiResponse } from '@/lib/gemini';
import {
  useFlashcardSets,
  useSaveGeneratedFlashcards,
  useReforgeFlashcards,
  useDeleteFlashcardSet,
  useTogglePublicStatus
} from '@/hooks/useFlashcards';

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'alphabetical' | 'oldest';
type MasteryFilter = 'all' | 'learning' | 'mastered';

export default function FlashcardDashboardPage() {
  const router = useRouter();

  // Modal state
  const [isReforgeModalOpen, setIsReforgeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isForgeModalOpen, setIsForgeModalOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [existingFlashcards, setExistingFlashcards] = useState<{ question: string; answer: string; difficulty: 'easy' | 'medium' | 'hard' }[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<string | undefined>(undefined);
  const [shareLinkCopied, setShareLinkCopied] = useState<string | null>(null);

  // Filter/Search state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');

  // TanStack Query hooks
  const { data: flashcardSets = [], isLoading } = useFlashcardSets();
  const saveFlashcardsMutation = useSaveGeneratedFlashcards();
  const reforgeMutation = useReforgeFlashcards();
  const deleteMutation = useDeleteFlashcardSet();
  const togglePublicMutation = useTogglePublicStatus();

  // Keep the old hook for utility functions not yet migrated
  const { getFirstCardInSet, getFlashcardsBySet } = useFlashcardActions();

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

  const handleCardClick = useCallback(async (setId: string) => {
    try {
      const firstCard = await getFirstCardInSet(setId);
      if (firstCard) {
        router.push(`/flashcards/${firstCard.id}`);
      }
    } catch (error) {
      console.error('Error navigating to first card:', error);
    }
  }, [getFirstCardInSet, router]);

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

  return (
    <>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/8 border border-accent/10">
              <FlashcardIcon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Flashcards
                </h1>
                <span className="text-xs font-medium text-foreground-muted bg-surface px-2 py-0.5 rounded-md">
                  {totalSets} sets
                </span>
              </div>
              <p className="text-sm text-foreground-muted/70 mt-0.5">
                Study with AI-generated interactive flashcards
              </p>
            </div>
          </div>

          <HeroActionButton
            icon={<FlashcardAddIcon className="w-5 h-5" />}
            onClick={() => setIsForgeModalOpen(true)}
          >
            Forge Flashcards
          </HeroActionButton>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardsDueToday />
          <MasteryProgress />
        </div>

        {/* Success/Error Message */}
        {saveSuccess && (
          <div
            className={`px-4 py-3 rounded-xl border-2 transition-all ${
              saveSuccess.includes('Error')
                ? 'border-red-200 bg-gradient-to-r from-red-50 to-red-100/50'
                : 'border-green-200 bg-gradient-to-r from-green-50 to-green-100/50'
            }`}
          >
            <p className={`text-sm font-semibold ${
              saveSuccess.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}>
              {saveSuccess}
            </p>
          </div>
        )}

        {/* Search and Filters */}
        <ClayCard variant="default" padding="md" className="rounded-2xl">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search flashcard sets by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gradient-to-r from-surface to-surface-elevated/50 border border-border/80 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-foreground placeholder:text-foreground-muted"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Mastery Filter */}
              <div className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-foreground-muted" />
                <div className="flex items-center gap-1 p-1 rounded-lg bg-surface/70 border border-border/50">
                  <button
                    onClick={() => setMasteryFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      masteryFilter === 'all'
                        ? 'bg-surface-elevated text-foreground shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setMasteryFilter('learning')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                      masteryFilter === 'learning'
                        ? 'bg-surface-elevated text-foreground shadow-sm'
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
                        ? 'bg-surface-elevated text-foreground shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <CheckmarkCircle01Icon className="w-3 h-3" />
                    Mastered
                  </button>
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-surface/70 border border-border/50">
                <button
                  onClick={() => setSortBy('recent')}
                  className={`p-2 rounded-md transition-all ${
                    sortBy === 'recent'
                      ? 'bg-surface-elevated text-accent shadow-sm'
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
                      ? 'bg-surface-elevated text-accent shadow-sm'
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
                      ? 'bg-surface-elevated text-accent shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                  title="Sort by oldest"
                >
                  <Calendar03Icon className="w-4 h-4" />
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-surface/70 border border-border/50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-surface-elevated text-accent shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                  title="Grid view"
                >
                  <GridViewIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-surface-elevated text-accent shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                  title="List view"
                >
                  <Menu01Icon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </ClayCard>

        {/* Content */}
        {isLoading ? (
          <FlashcardsSkeleton viewMode={viewMode} />
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

            {/* Flashcard Sets Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {processedSets.map((set) => (
                  <FlashcardGridItem
                    key={set.id}
                    set={set}
                    onClick={() => handleCardClick(set.id)}
                    onReforge={() => handleReforgeFlashcards(set)}
                    onDelete={() => handleDeleteFlashcardSet(set)}
                    onShare={(e) => handleCopyShareLink(set, e)}
                    shareLinkCopied={shareLinkCopied === set.id}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {processedSets.map((set) => (
                  <FlashcardListItem
                    key={set.id}
                    set={set}
                    onClick={() => handleCardClick(set.id)}
                    onReforge={() => handleReforgeFlashcards(set)}
                    onDelete={() => handleDeleteFlashcardSet(set)}
                    onShare={(e) => handleCopyShareLink(set, e)}
                    shareLinkCopied={shareLinkCopied === set.id}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

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
    </>
  );
}

// ============================================
// Sub-components
// ============================================

function FlashcardsSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[68px] rounded-xl bg-surface/60 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <ClayCard key={i} variant="default" padding="none" className="rounded-2xl animate-pulse overflow-hidden">
          <div className="h-1 w-full bg-surface" />
          <div className="p-5 space-y-4">
            <div className="h-5 w-3/4 bg-surface rounded-md" />
            <div className="h-3 w-1/2 bg-surface/60 rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-3 w-32 bg-surface/60 rounded" />
              <div className="h-1.5 w-full bg-surface rounded-full" />
            </div>
            <div className="h-3 w-16 bg-background-muted rounded pt-2" />
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
    <ClayCard variant="default" padding="lg" className="rounded-2xl">
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-accent/8 border border-accent/10 flex items-center justify-center mx-auto mb-6">
          <SparklesIcon className="w-7 h-7 text-accent" />
        </div>

        {hasFilters ? (
          <>
            <h3 className="text-lg font-semibold text-foreground mb-2">No matching flashcard sets</h3>
            <p className="text-sm text-foreground-muted mb-6 max-w-sm mx-auto">
              Try adjusting your search or filters to find what you&apos;re looking for
            </p>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 rounded-lg bg-surface-elevated text-sm text-foreground font-medium border border-border hover:shadow-sm transition-all"
            >
              Clear filters
            </button>
          </>
        ) : totalSets === 0 ? (
          <>
            <h3 className="text-lg font-semibold text-foreground mb-2">Start studying with flashcards</h3>
            <p className="text-sm text-foreground-muted mb-6 max-w-sm mx-auto">
              Create flashcards from your notes to begin studying
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
            <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
            <p className="text-sm text-foreground-muted mb-6 max-w-sm mx-auto">
              No flashcard sets match your current filters
            </p>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 rounded-lg bg-surface-elevated text-sm text-foreground font-medium border border-border hover:shadow-sm transition-all"
            >
              Clear filters
            </button>
          </>
        )}
      </div>
    </ClayCard>
  );
}

function FlashcardGridItem({
  set,
  onClick,
  onReforge,
  onDelete,
  onShare,
  shareLinkCopied,
  formatDate
}: {
  set: FlashcardSet;
  onClick: () => void;
  onReforge: () => void;
  onDelete: () => void;
  onShare: (e: React.MouseEvent) => void;
  shareLinkCopied: boolean;
  formatDate: (date: string) => string;
}) {
  const progress = Math.round((set.mastered_cards / set.total_cards) * 100) || 0;
  const isMastered = progress === 100;

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <ClayCard
        variant="default"
        padding="none"
        className="rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      >
        {/* Thin progress accent bar at top */}
        <div className="h-1 w-full bg-surface">
          <div
            className={`h-full rounded-r-full transition-all duration-500 ${
              isMastered ? 'bg-emerald-400' : 'bg-accent'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card body */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Title + public badge */}
          <div className="mb-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[15px] text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                {set.title}
              </h3>
              {set.is_public && (
                <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                  Public
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {set.description && (
            <p className="text-xs text-foreground-muted/70 line-clamp-1 mb-4">
              {set.description}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-foreground-muted mb-3">
            <span>
              <span className="font-medium text-foreground">{set.total_cards}</span> cards
            </span>
            <span className="text-border-light">&middot;</span>
            <span>
              <span className={`font-medium ${isMastered ? 'text-emerald-600' : 'text-foreground'}`}>
                {set.mastered_cards}
              </span> mastered
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isMastered ? 'bg-emerald-400' : 'bg-accent/70'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Footer: timestamp + actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/80">
            <span className="text-[11px] text-foreground-muted/60">
              {set.updated_at ? formatDate(set.updated_at) : 'Never'}
            </span>

            {/* Actions - visible on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                className={`p-1.5 rounded-md transition-colors ${
                  shareLinkCopied
                    ? 'text-emerald-500'
                    : 'text-foreground-muted/50 hover:text-accent hover:bg-accent/5'
                }`}
                title={shareLinkCopied ? 'Copied!' : 'Share'}
                onClick={onShare}
              >
                <Share01Icon className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1.5 rounded-md text-foreground-muted/50 hover:text-accent hover:bg-accent/5 transition-colors"
                title="Reforge flashcards"
                onClick={(e) => {
                  e.stopPropagation();
                  onReforge();
                }}
              >
                <RefreshIcon className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1.5 rounded-md text-foreground-muted/50 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete set"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Delete01Icon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </ClayCard>
    </div>
  );
}

function FlashcardListItem({
  set,
  onClick,
  onReforge,
  onDelete,
  onShare,
  shareLinkCopied,
  formatDate
}: {
  set: FlashcardSet;
  onClick: () => void;
  onReforge: () => void;
  onDelete: () => void;
  onShare: (e: React.MouseEvent) => void;
  shareLinkCopied: boolean;
  formatDate: (date: string) => string;
}) {
  const progress = Math.round((set.mastered_cards / set.total_cards) * 100) || 0;
  const isMastered = progress === 100;

  return (
    <div onClick={onClick} className="cursor-pointer">
      <ClayCard variant="default" padding="none" className="rounded-xl overflow-hidden group transition-all duration-200 hover:shadow-md">
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Progress ring / indicator */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-border"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${progress * 0.942} 100`}
                className={isMastered ? 'text-emerald-400' : 'text-accent'}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground-muted">
              {progress}%
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm text-foreground truncate group-hover:text-accent transition-colors">
                {set.title}
              </h3>
              {set.is_public && (
                <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                  Public
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-foreground-muted/60">
              <span>{set.total_cards} cards</span>
              <span>&middot;</span>
              <span className={isMastered ? 'text-emerald-600' : ''}>{set.mastered_cards} mastered</span>
              <span>&middot;</span>
              <span>{formatDate(set.updated_at || set.created_at)}</span>
            </div>
          </div>

          {/* Actions - appear on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              className={`p-1.5 rounded-md transition-colors ${
                shareLinkCopied
                  ? 'text-emerald-500'
                  : 'text-foreground-muted/40 hover:text-accent hover:bg-accent/5'
              }`}
              title={shareLinkCopied ? 'Copied!' : 'Share'}
              onClick={onShare}
            >
              <Share01Icon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReforge();
              }}
              className="p-1.5 rounded-md text-foreground-muted/40 hover:text-accent hover:bg-accent/5 transition-colors"
              title="Reforge flashcards"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-md text-foreground-muted/40 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete set"
            >
              <Delete01Icon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </ClayCard>
    </div>
  );
}

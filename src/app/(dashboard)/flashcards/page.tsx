'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import {
  BookOpen01Icon,
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
import HeroActionButton from '@/component/ui/HeroActionButton';
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
        <ClayCard variant="elevated" padding="lg" className="rounded-3xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-bl from-accent/10 via-accent/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-purple-500/8 via-purple-500/4 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Title area */}
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/20 shadow-lg shadow-accent/10">
                  <BookOpen01Icon className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                      Flashcards
                    </h1>
                    <ClayBadge variant="accent" className="text-xs px-2 py-1">
                      <SparklesIcon className="w-3 h-3" />
                      {totalSets} sets
                    </ClayBadge>
                  </div>
                  <p className="text-foreground-muted">
                    Study with AI-generated interactive flashcards
                  </p>
                </div>
              </div>

              {/* CTA */}
              <HeroActionButton
                theme="accent"
                icon={<SparklesIcon className="w-5 h-5" />}
                onClick={() => setIsForgeModalOpen(true)}
              >
                Forge Flashcards
              </HeroActionButton>
            </div>
          </div>
        </ClayCard>

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
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200/80 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-foreground placeholder:text-foreground-muted"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Mastery Filter */}
              <div className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-foreground-muted" />
                <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100/70 border border-gray-200/50">
                  <button
                    onClick={() => setMasteryFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      masteryFilter === 'all'
                        ? 'bg-white text-foreground shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setMasteryFilter('learning')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                      masteryFilter === 'learning'
                        ? 'bg-white text-foreground shadow-sm'
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
                        ? 'bg-white text-foreground shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <CheckmarkCircle01Icon className="w-3 h-3" />
                    Mastered
                  </button>
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100/70 border border-gray-200/50">
                <button
                  onClick={() => setSortBy('recent')}
                  className={`p-2 rounded-md transition-all ${
                    sortBy === 'recent'
                      ? 'bg-white text-accent shadow-sm'
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
                      ? 'bg-white text-accent shadow-sm'
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
                      ? 'bg-white text-accent shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                  title="Sort by oldest"
                >
                  <Calendar03Icon className="w-4 h-4" />
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100/70 border border-gray-200/50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-accent shadow-sm'
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
                      ? 'bg-white text-accent shadow-sm'
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
          <div key={i} className="h-24 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <ClayCard key={i} variant="default" padding="none" className="rounded-2xl animate-pulse overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="h-6 w-2/3 bg-gray-200 rounded-lg" />
              <div className="h-8 w-8 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full" />
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="px-5 py-4 bg-gray-50 flex justify-between">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-20 bg-gray-200 rounded-lg" />
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
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5 rounded-3xl rotate-6" />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-3xl -rotate-6" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center shadow-lg">
            <SparklesIcon className="w-16 h-16 text-accent" />
          </div>
        </div>

        {hasFilters ? (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">No matching flashcard sets</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Try adjusting your search or filters to find what you&apos;re looking for
            </p>
            <button
              onClick={onClearFilters}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 text-foreground font-semibold border border-gray-200/80 hover:shadow-md transition-all"
            >
              Clear filters
            </button>
          </>
        ) : totalSets === 0 ? (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">Start studying with flashcards</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Create flashcards from your notes to begin studying with AI-generated content
            </p>
            <HeroActionButton
              theme="accent"
              icon={<SparklesIcon className="w-5 h-5" />}
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
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 text-foreground font-semibold border border-gray-200/80 hover:shadow-md transition-all"
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

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <ClayCard
        variant="default"
        padding="none"
        className="rounded-2xl overflow-hidden h-full flex flex-col hover:scale-[1.02] transition-all duration-300"
      >
        {/* Card Header */}
        <div className="p-5 flex-1">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors truncate">
                  {set.title}
                </h3>
                {set.is_public && (
                  <ClayBadge variant="success" className="text-xs px-2 py-0.5 shrink-0">
                    Public
                  </ClayBadge>
                )}
              </div>
              <p className="text-sm text-foreground-muted line-clamp-2">
                {set.description || 'No description'}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-accent/10 shrink-0">
              <BookOpen01Icon className="w-5 h-5 text-accent" />
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">Progress</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-accent to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-foreground-muted">
                  <span className="font-medium text-foreground">{set.total_cards}</span> cards
                </span>
                <span className="text-foreground-muted">
                  <span className="font-medium text-green-600">{set.mastered_cards}</span> mastered
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-5 py-4 bg-gray-50 flex items-center justify-between gap-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <Clock01Icon className="w-3.5 h-3.5" />
            <span>{set.updated_at ? formatDate(set.updated_at) : 'Never'}</span>
          </div>

          <div className="flex gap-2">
            <button
              className={`p-2 rounded-lg transition-all duration-200 ${
                shareLinkCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-accent/10 hover:bg-accent text-accent hover:text-white'
              }`}
              title={shareLinkCopied ? 'Copied!' : 'Share'}
              onClick={onShare}
            >
              <Share01Icon className="w-4 h-4" />
            </button>

            <button
              className="p-2 rounded-lg bg-accent/10 hover:bg-accent text-accent hover:text-white transition-all duration-200"
              title="Reforge flashcards"
              onClick={(e) => {
                e.stopPropagation();
                onReforge();
              }}
            >
              <RefreshIcon className="w-4 h-4" />
            </button>

            <button
              className="p-2 rounded-lg bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-200"
              title="Delete set"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Delete01Icon className="w-4 h-4" />
            </button>
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

  return (
    <div onClick={onClick} className="cursor-pointer">
      <ClayCard variant="default" padding="none" className="rounded-2xl overflow-hidden group hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 p-4">
          {/* Progress indicator */}
          <div
            className="w-2 h-16 rounded-full flex-shrink-0 bg-gradient-to-b from-accent to-purple-500"
            style={{ opacity: Math.max(0.3, progress / 100) }}
          />

          {/* Icon */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-accent/20 to-purple-500/20">
            <BookOpen01Icon className="w-6 h-6 text-accent" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                {set.title}
              </h3>
              {set.is_public && (
                <ClayBadge variant="success" className="text-xs px-2 py-0.5 shrink-0">
                  Public
                </ClayBadge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-foreground-muted flex items-center gap-1">
                <Clock01Icon className="w-3 h-3" />
                {formatDate(set.updated_at || set.created_at)}
              </span>
              <span className="text-xs text-foreground-muted">
                <span className="font-medium text-foreground">{set.total_cards}</span> cards
              </span>
              <span className="text-xs text-foreground-muted">
                <span className="font-medium text-green-600">{set.mastered_cards}</span> mastered
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-accent to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className={`p-2 rounded-lg transition-all duration-200 ${
                shareLinkCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-accent/10 hover:bg-accent text-accent hover:text-white'
              }`}
              title={shareLinkCopied ? 'Copied!' : 'Share'}
              onClick={onShare}
            >
              <Share01Icon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReforge();
              }}
              className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
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
      </ClayCard>
    </div>
  );
}

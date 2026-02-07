'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
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
  const totalCards = flashcardSets.reduce((sum, s) => sum + s.total_cards, 0);

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

  // Handle auth errors
  if (flashcardSets === undefined && !isLoading) {
    return (
      <div className="space-y-6">
        <FlashcardsHeader totalSets={0} totalCards={0} onCreateNew={() => setIsForgeModalOpen(true)} />
        <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mx-auto mb-6">
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
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gradient-to-r from-surface to-surface-elevated/50 border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-foreground-muted"
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
                      ? 'bg-surface-elevated text-primary shadow-sm'
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
                      ? 'bg-surface-elevated text-primary shadow-sm'
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
                      ? 'bg-surface-elevated text-primary shadow-sm'
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

        {/* Content */}
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
                  onClick={() => handleCardClick(set.id)}
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
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-secondary/8 via-secondary/4 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title area */}
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-muted to-primary-muted/60 shadow-lg shadow-primary/10">
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
      </div>
    </ClayCard>
  );
}

function FlashcardsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-[72px] rounded-2xl bg-gradient-to-r from-surface to-surface-elevated/50 animate-pulse" />
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
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl rotate-6" />
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-3xl -rotate-6" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-primary-muted to-primary-muted/60 flex items-center justify-center shadow-lg">
            <FlashcardIcon className="w-16 h-16 text-primary" />
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
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-surface to-surface-elevated/50 text-foreground font-semibold border border-border/80 hover:shadow-md transition-all"
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
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-surface to-surface-elevated/50 text-foreground font-semibold border border-border/80 hover:shadow-md transition-all"
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

  // Choose accent colors based on mastery
  const accentColor = isMastered ? '#10b981' : '#6366f1';
  const accentColorLight = isMastered ? '#34d399' : '#818cf8';
  const accentShadow = isMastered ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)';

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
    <div onClick={onClick} className="block group cursor-pointer">
      <ClayCard variant="default" padding="none" className="rounded-2xl overflow-hidden hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 p-3 pr-5">
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
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-foreground-muted flex items-center gap-1">
                <Clock01Icon className="w-3 h-3" />
                {formatDate(set.updated_at || set.created_at)}
              </span>
              <span className="text-xs text-foreground-muted">
                <span className="font-medium text-foreground">{set.total_cards}</span> cards
              </span>
              <span className={`text-xs ${isMastered ? 'text-emerald-600 font-medium' : 'text-foreground-muted'}`}>
                {set.mastered_cards}/{set.total_cards} mastered
              </span>
              {/* Mini progress bar */}
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-16 bg-surface rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isMastered ? 'bg-emerald-400' : 'bg-primary/70'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-foreground-muted">{progress}%</span>
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
      </ClayCard>
    </div>
  );
}

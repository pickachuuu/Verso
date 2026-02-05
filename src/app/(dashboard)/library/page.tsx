'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import ClayNotebookCover, { NotebookColorKey, NOTEBOOK_COLORS } from '@/component/ui/ClayNotebookCover';
import CreateNoteButton from '@/component/features/CreateNoteButton';
import {
  Book02Icon,
  BookOpen01Icon,
  Search01Icon,
  FilterIcon,
  GridViewIcon,
  Menu01Icon,
  SparklesIcon,
  Clock01Icon,
  SortingAZ01Icon,
  Calendar03Icon
} from 'hugeicons-react';
import { useFlashcardActions } from '@/hook/useFlashcardActions';
import GenerateFlashCardModal from '@/component/features/modal/GenerateFlashCardModal';
import ConfirmDeleteModal from '@/component/features/modal/ConfirmDeleteModal';
import { GeminiResponse } from '@/lib/gemini';

// TanStack Query hooks
import { useUserNotes, useDeleteNote, Note } from '@/hooks/useNotes';

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'alphabetical' | 'oldest';

export default function LibraryPage() {
  const { saveGeneratedFlashcards } = useFlashcardActions();

  // TanStack Query for data fetching
  const { data: notes = [], isLoading, error, refetch } = useUserNotes();
  const deleteNoteMutation = useDeleteNote();

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<NotebookColorKey | 'all'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Flashcard generation state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Filter and sort notes
  const processedNotes = useMemo(() => {
    let filtered = notes.filter(
      (note) =>
        (note.title && note.title.trim() !== '') ||
        (note.content && note.content.trim() !== '') ||
        (Array.isArray(note.tags) && note.tags.length > 0)
    );

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title?.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Color filter
    if (selectedColor !== 'all') {
      filtered = filtered.filter((note) => (note.cover_color || 'lavender') === selectedColor);
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
        filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }

    return filtered;
  }, [notes, searchQuery, selectedColor, sortBy]);

  // Stats
  const totalNotes = notes.filter(
    (note) =>
      (note.title && note.title.trim() !== '') ||
      (note.content && note.content.trim() !== '')
  ).length;

  const handleGenerateFlashcards = (note: Note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const handleDeleteNote = (note: Note) => {
    setSelectedNote(note);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedNote) return;

    try {
      await deleteNoteMutation.mutateAsync(selectedNote.id);
      setSaveSuccess('Notebook deleted successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting notebook:', err);
      setSaveSuccess('Error deleting notebook. Please try again.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedNote(null);
    }
  };

  const handleFlashcardsGenerated = async (geminiResponse: GeminiResponse) => {
    if (!selectedNote) return;

    setSaving(true);
    setSaveSuccess(null);
    try {
      const difficulty = geminiResponse.flashcards[0]?.difficulty || 'medium';
      await saveGeneratedFlashcards({
        noteId: selectedNote.id,
        noteTitle: selectedNote.title,
        difficulty,
        geminiResponse
      });

      setSaveSuccess(`Successfully saved ${geminiResponse.flashcards.length} flashcards!`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving flashcards:', err);
      setSaveSuccess('Error saving flashcards. Please try again.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
  };

  // Handle auth errors
  if (error) {
    return (
      <div className="space-y-6">
        <LibraryHeader totalNotes={0} />
        <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mx-auto mb-6">
              <Book02Icon className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Error loading notebooks</h3>
            <p className="text-foreground-muted mb-6">
              There was an error loading your notebooks. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              Retry
            </button>
          </div>
        </ClayCard>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Hero Header */}
        <LibraryHeader totalNotes={totalNotes} />

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
                placeholder="Search notebooks by title or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200/80 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-foreground-muted"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Color Filter */}
              <div className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-foreground-muted" />
                <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100/70 border border-gray-200/50">
                  <button
                    onClick={() => setSelectedColor('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      selectedColor === 'all'
                        ? 'bg-white text-foreground shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    All
                  </button>
                  {(Object.keys(NOTEBOOK_COLORS) as NotebookColorKey[]).slice(0, 4).map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded-md transition-all ${
                        selectedColor === color ? 'ring-2 ring-offset-1 ring-foreground/30 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ background: NOTEBOOK_COLORS[color].primary }}
                      title={NOTEBOOK_COLORS[color].name}
                    />
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100/70 border border-gray-200/50">
                <button
                  onClick={() => setSortBy('recent')}
                  className={`p-2 rounded-md transition-all ${
                    sortBy === 'recent'
                      ? 'bg-white text-primary shadow-sm'
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
                      ? 'bg-white text-primary shadow-sm'
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
                      ? 'bg-white text-primary shadow-sm'
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
                      ? 'bg-white text-primary shadow-sm'
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
                      ? 'bg-white text-primary shadow-sm'
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
          <NotebooksSkeleton viewMode={viewMode} />
        ) : processedNotes.length === 0 ? (
          <EmptyState
            hasFilters={searchQuery.trim() !== '' || selectedColor !== 'all'}
            onClearFilters={() => {
              setSearchQuery('');
              setSelectedColor('all');
            }}
          />
        ) : (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground-muted">
                Showing <span className="font-semibold text-foreground">{processedNotes.length}</span> notebook{processedNotes.length !== 1 ? 's' : ''}
                {(searchQuery || selectedColor !== 'all') && (
                  <span> matching your filters</span>
                )}
              </p>
            </div>

            {/* Notebooks Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {processedNotes.map((note) => (
                  <Link href={`/editor/${note.slug || note.id}`} key={note.id} className="block">
                    <ClayNotebookCover
                      mode="card"
                      title={note.title}
                      tags={note.tags || []}
                      updatedAt={note.updated_at}
                      color={(note.cover_color as NotebookColorKey) || 'lavender'}
                      onGenerateFlashcards={() => handleGenerateFlashcards(note)}
                      onDelete={() => handleDeleteNote(note)}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {processedNotes.map((note) => (
                  <NotebookListItem
                    key={note.id}
                    note={note}
                    onGenerateFlashcards={() => handleGenerateFlashcards(note)}
                    onDelete={() => handleDeleteNote(note)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <GenerateFlashCardModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        noteContent={selectedNote?.content || ''}
        onFlashcardsGenerated={handleFlashcardsGenerated}
        saving={saving}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Notebook"
        description="Are you sure you want to delete this notebook? This action cannot be undone."
        itemName={selectedNote?.title || 'Untitled Notebook'}
        itemType="notebook"
      />
    </>
  );
}

// ============================================
// Sub-components
// ============================================

function LibraryHeader({ totalNotes }: { totalNotes: number }) {
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
              <Book02Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Your Library
                </h1>
                <ClayBadge variant="accent" className="text-xs px-2 py-1">
                  <SparklesIcon className="w-3 h-3" />
                  {totalNotes} notebooks
                </ClayBadge>
              </div>
              <p className="text-foreground-muted">
                Your personal collection of study notebooks and knowledge
              </p>
            </div>
          </div>

          {/* CTA */}
          <CreateNoteButton />
        </div>
      </div>
    </ClayCard>
  );
}

function NotebooksSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
      <div className="text-center py-16">
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl rotate-6" />
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-3xl -rotate-6" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-primary-muted to-primary-muted/60 flex items-center justify-center shadow-lg">
            <BookOpen01Icon className="w-16 h-16 text-primary" />
          </div>
        </div>

        {hasFilters ? (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">No matching notebooks</h3>
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
        ) : (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">Start your library</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Create your first notebook to begin organizing your study materials and generating flashcards
            </p>
            <CreateNoteButton />
          </>
        )}
      </div>
    </ClayCard>
  );
}

function NotebookListItem({
  note,
  onGenerateFlashcards,
  onDelete,
}: {
  note: Note;
  onGenerateFlashcards: () => void;
  onDelete: () => void;
}) {
  const color = (note.cover_color as NotebookColorKey) || 'lavender';
  const colorTheme = NOTEBOOK_COLORS[color];

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
    <Link href={`/editor/${note.slug || note.id}`}>
      <ClayCard variant="default" padding="none" className="rounded-2xl overflow-hidden group hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 p-4">
          {/* Color indicator */}
          <div
            className="w-2 h-16 rounded-full flex-shrink-0"
            style={{ background: `linear-gradient(180deg, ${colorTheme.primary}, ${colorTheme.secondary})` }}
          />

          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${colorTheme.accent}40, ${colorTheme.primary}20)` }}
          >
            <Book02Icon className="w-6 h-6" style={{ color: colorTheme.primary }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {note.title || 'Untitled Notebook'}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-foreground-muted flex items-center gap-1">
                <Clock01Icon className="w-3 h-3" />
                {formatDate(note.updated_at)}
              </span>
              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  {note.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: `${colorTheme.primary}15`,
                        color: colorTheme.primary,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="text-xs text-foreground-muted">+{note.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onGenerateFlashcards();
              }}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Generate flashcards"
            >
              <SparklesIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              title="Delete notebook"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </ClayCard>
    </Link>
  );
}

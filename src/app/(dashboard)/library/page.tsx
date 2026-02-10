'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import MobileBottomSheet from '@/component/ui/MobileBottomSheet';
import { NotebookColorKey, NOTEBOOK_COLORS } from '@/component/ui/ClayNotebookCover';
import CreateNoteButton from '@/component/features/CreateNoteButton';
import {
  Search01Icon,
  FilterIcon,
  SparklesIcon,
  Clock01Icon,
  SortingAZ01Icon,
  Calendar03Icon
} from 'hugeicons-react';
import { NotebookIcon } from '@/component/icons';
import { useFlashcardActions } from '@/hook/useFlashcardActions';
import GenerateFlashCardModal from '@/component/features/modal/GenerateFlashCardModal';
import ConfirmDeleteModal from '@/component/features/modal/ConfirmDeleteModal';
import { GeminiResponse } from '@/lib/gemini';

// TanStack Query hooks
import { useUserNotes, useDeleteNote, Note } from '@/hooks/useNotes';

type SortOption = 'recent' | 'alphabetical' | 'oldest';

export default function LibraryPage() {
  const { saveGeneratedFlashcards } = useFlashcardActions();

  // TanStack Query for data fetching
  const { data: notes = [], isLoading, error, refetch } = useUserNotes();
  const deleteNoteMutation = useDeleteNote();

  // UI State
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<NotebookColorKey | 'all'>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Flashcard generation state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Filter and sort notes
  const processedNotes = useMemo(() => {
    let filtered = [...notes];

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
      filtered = filtered.filter((note) => (note.cover_color || 'royal') === selectedColor);
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
  const sortLabel = sortBy === 'recent' ? 'Most recent' : sortBy === 'alphabetical' ? 'A–Z' : 'Oldest';
  const colorLabel = selectedColor === 'all' ? 'All colors' : NOTEBOOK_COLORS[selectedColor].name;
  const activeFilters = Number(selectedColor !== 'all');

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
            <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
              <NotebookIcon className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Error loading notebooks</h3>
            <p className="text-foreground-muted mb-6">
              There was an error loading your notebooks. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
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
                  placeholder="Search notebooks..."
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
              <span>Showing {processedNotes.length} notebook{processedNotes.length !== 1 ? 's' : ''}</span>
              <span>{colorLabel} · {sortLabel}</span>
            </div>
          </div>

            {isLoading ? (
              <NotebooksSkeleton />
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

                {/* Notebooks List */}
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
                  placeholder="Search notebooks..."
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
                    Color
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setSelectedColor('all')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
                        selectedColor === 'all'
                          ? 'bg-background-muted text-foreground border-border'
                          : 'text-foreground-muted border-transparent hover:text-foreground hover:border-border'
                      }`}
                    >
                      All
                    </button>
                    {(Object.keys(NOTEBOOK_COLORS) as NotebookColorKey[]).slice(0, 6).map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-7 h-7 rounded-md transition-all border ${
                          selectedColor === color ? 'border-pencil/60 ring-2 ring-offset-1 ring-foreground/20 scale-105' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ background: NOTEBOOK_COLORS[color].primary }}
                        title={NOTEBOOK_COLORS[color].name}
                      />
                    ))}
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
                  <p className="text-xs uppercase tracking-wide text-foreground-muted">Total</p>
                  <p className="text-2xl font-bold text-foreground">{totalNotes}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground-muted">Showing</p>
                  <p className="text-2xl font-bold text-foreground">{processedNotes.length}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-foreground-muted">
                {colorLabel} · {sortLabel}
              </div>
            </ClayCard>
          </div>
        </div>
      </div>

      <MobileBottomSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filters"
        description="Refine your notebooks"
        footer={(
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedColor('all');
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
              Color
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedColor('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
                  selectedColor === 'all'
                    ? 'bg-background-muted text-foreground border-border'
                    : 'text-foreground-muted border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                All
              </button>
              {(Object.keys(NOTEBOOK_COLORS) as NotebookColorKey[]).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-md transition-all border ${
                    selectedColor === color ? 'border-pencil/60 ring-2 ring-offset-1 ring-foreground/20 scale-105' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ background: NOTEBOOK_COLORS[color].primary }}
                  title={NOTEBOOK_COLORS[color].name}
                />
              ))}
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
              <span>Total</span>
              <span className="font-semibold text-foreground">{totalNotes}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Showing</span>
              <span className="font-semibold text-foreground">{processedNotes.length}</span>
            </div>
            <div className="mt-2 text-[11px]">{colorLabel} · {sortLabel}</div>
          </div>
        </div>
      </MobileBottomSheet>

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
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Title area */}
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-2xl bg-background-muted border border-border">
            <NotebookIcon className="w-8 h-8 text-primary" />
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
    </ClayCard>
  );
}

function NotebooksSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <ClayCard key={i} variant="default" padding="none" className="rounded-2xl overflow-hidden animate-pulse">
          <div className="flex items-stretch">
            <div className="w-1 bg-background-muted" />
            <div className="flex items-center gap-4 p-3 pr-5 flex-1">
              <div className="w-12 h-14 bg-background-muted rounded-lg" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-2/3 bg-background-muted rounded" />
                <div className="h-3 w-1/2 bg-background-muted/80 rounded" />
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-2.5 w-20 bg-background-muted/70 rounded" />
                  <div className="h-2.5 w-12 bg-background-muted/70 rounded" />
                  <div className="hidden sm:block h-2.5 w-10 bg-background-muted/70 rounded" />
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

function NotebookListItem({
  note,
  onGenerateFlashcards,
  onDelete,
}: {
  note: Note;
  onGenerateFlashcards: () => void;
  onDelete: () => void;
}) {
  const color = (note.cover_color as NotebookColorKey) || 'royal';
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

  // Extract a plain-text preview from HTML content
  const getContentPreview = (content: string) => {
    if (!content) return null;
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (text.length === 0) return null;
    return text.length > 80 ? text.slice(0, 80) + '...' : text;
  };

  // Estimate word count from content
  const getWordCount = (content: string) => {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, '').trim();
    if (text.length === 0) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  };

  const preview = getContentPreview(note.content);
  const wordCount = getWordCount(note.content);

  return (
    <Link href={`/editor/${note.slug || note.id}`} className="block group">
      <ClayCard variant="default" padding="none" className="rounded-2xl overflow-hidden hover:shadow-lg transition-all">
        <div className="flex items-stretch">
          {/* Color accent left border */}
          <div
            className="w-1 flex-shrink-0 rounded-l-2xl"
            style={{ background: `linear-gradient(180deg, ${colorTheme.primary}, ${colorTheme.secondary})` }}
          />

          <div className="flex items-center gap-4 p-3 pr-5 flex-1 min-w-0">
            {/* 3D mini notebook */}
            <div className="relative flex-shrink-0" style={{ width: 54, height: 62 }}>
              {/* Page edges — thin stack, only visible on right + bottom */}
              <div
                className="absolute rounded-[5px]"
                style={{ top: 3, left: 3, right: 0, bottom: 0, background: '#d8d5d0', boxShadow: '1px 1px 2px rgba(0,0,0,0.12)' }}
              />
              <div
                className="absolute rounded-[5px]"
                style={{ top: 2, left: 2, right: 1, bottom: 1, background: '#e5e2dd' }}
              />
              <div
                className="absolute rounded-[5px]"
                style={{ top: 1, left: 1, right: 2, bottom: 2, background: '#eeecea' }}
              />

              {/* Cover — sits on top */}
              <div
                className="absolute rounded-[5px] overflow-hidden"
                style={{
                  top: 0,
                  left: 0,
                  right: 3,
                  bottom: 3,
                  background: `linear-gradient(145deg, ${colorTheme.primary} 0%, ${colorTheme.secondary} 60%, ${colorTheme.primary} 100%)`,
                  boxShadow: `2px 3px 6px ${colorTheme.shadow}`,
                }}
              >
                {/* Glossy highlight */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: '-10%',
                    left: '10%',
                    right: '30%',
                    bottom: '50%',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                    borderRadius: '50%',
                    filter: 'blur(1px)',
                  }}
                />
                {/* Spine shadow */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[5px]"
                  style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.25) 0%, transparent 100%)' }}
                />
                {/* Elastic band */}
                <div
                  className="absolute right-[4px] top-0 bottom-0 w-[2px] rounded-full"
                  style={{ background: 'rgba(0,0,0,0.25)' }}
                />
                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <NotebookIcon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {note.title || 'Untitled Notebook'}
              </h3>
              {/* Content preview */}
              {preview && (
                <p className="text-xs text-foreground-muted/70 truncate mt-0.5">{preview}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-foreground-muted flex items-center gap-1">
                  <Clock01Icon className="w-3 h-3" />
                  {formatDate(note.updated_at)}
                </span>
                {wordCount > 0 && (
                  <span className="text-xs text-foreground-muted">
                    {wordCount.toLocaleString()} words
                  </span>
                )}
                {note.tags && note.tags.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1">
                    {note.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
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
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
        </div>
      </ClayCard>
    </Link>
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
        <div className="w-28 h-28 mx-auto mb-8 rounded-3xl bg-background-muted border border-border flex items-center justify-center">
          <NotebookIcon className="w-14 h-14 text-primary" />
        </div>

        {hasFilters ? (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">No matching notebooks</h3>
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


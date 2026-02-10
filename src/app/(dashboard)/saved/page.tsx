'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ClayBadge, ClayButton, ClayCard } from '@/component/ui/Clay';
import MobileBottomSheet from '@/component/ui/MobileBottomSheet';
import { Bookmark01Icon, FilterIcon, Search01Icon } from 'hugeicons-react';
import { NotebookIcon, FlashcardIcon, ExamIcon } from '@/component/icons';
import { SavedMaterialType, useRemoveReference, useSavedMaterials } from '@/hooks/useSavedMaterials';

const FILTER_OPTIONS: { id: SavedMaterialType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'note', label: 'Notes' },
  { id: 'flashcard', label: 'Flashcards' },
  { id: 'exam', label: 'Exams' },
];

const TYPE_META = {
  note: {
    label: 'Note',
    badge: 'accent',
    icon: NotebookIcon,
    tint: 'text-primary',
  },
  flashcard: {
    label: 'Flashcards',
    badge: 'success',
    icon: FlashcardIcon,
    tint: 'text-tertiary',
  },
  exam: {
    label: 'Exam',
    badge: 'warning',
    icon: ExamIcon,
    tint: 'text-secondary',
  },
} as const;

export default function SavedMaterialsPage() {
  const { data: savedItems = [], isLoading, isError } = useSavedMaterials();
  const removeReferenceMutation = useRemoveReference();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SavedMaterialType | 'all'>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    let filtered = [...savedItems];

    if (selectedType !== 'all') {
      filtered = filtered.filter((item) => item.type === selectedType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [savedItems, searchQuery, selectedType]);

  const stats = useMemo(() => {
    return {
      total: savedItems.length,
      notes: savedItems.filter((item) => item.type === 'note').length,
      flashcards: savedItems.filter((item) => item.type === 'flashcard').length,
      exams: savedItems.filter((item) => item.type === 'exam').length,
    };
  }, [savedItems]);

  const typeCounts = {
    all: stats.total,
    note: stats.notes,
    flashcard: stats.flashcards,
    exam: stats.exams,
  };
  const activeFilters = Number(selectedType !== 'all');

  const handleRemove = async (itemType: SavedMaterialType, itemId: string) => {
    const key = `${itemType}-${itemId}`;
    setRemovingId(key);
    try {
      await removeReferenceMutation.mutateAsync({ itemType, itemId });
    } catch (error) {
      console.error('Error removing saved item:', error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-background-muted border border-border">
              <Bookmark01Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Saved Materials</h1>
              <p className="text-foreground-muted mt-1">
                Quick access to your pinned notes, flashcards, and exams.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground-muted">
            <span className="px-3 py-1.5 rounded-full bg-background-muted border border-border">
              Notes {stats.notes}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-background-muted border border-border">
              Flashcards {stats.flashcards}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-background-muted border border-border">
              Exams {stats.exams}
            </span>
          </div>
        </div>
      </ClayCard>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-8 space-y-4">
          {/* Mobile controls */}
          <div className="lg:hidden space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface border border-border">
                <Search01Icon className="w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search saved materials..."
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
              <span>Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>
              <span>{selectedType === 'all' ? 'All types' : selectedType}</span>
            </div>
          </div>

          <ClayCard variant="default" padding="lg" className="rounded-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Your saved list</h2>
                <p className="text-sm text-foreground-muted">
                  Showing {filteredItems.length} of {stats.total} saved materials
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-2xl bg-background-muted border border-border flex items-center justify-center mx-auto mb-5">
                  <Bookmark01Icon className="w-9 h-9 text-foreground-muted animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Loading saved materials</h3>
                <p className="text-sm text-foreground-muted">Fetching your saved list.</p>
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
                  <Bookmark01Icon className="w-9 h-9 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Unable to load saved items</h3>
                <p className="text-sm text-foreground-muted">
                  Please try again in a moment.
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-background-muted border border-border flex items-center justify-center">
                  <Bookmark01Icon className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">No saved materials yet</h2>
                <p className="text-sm text-foreground-muted mb-6 max-w-md mx-auto">
                  Save items from the Community or public previews to pin them here for quick access.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href="/community" className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:shadow-md transition-all flex items-center gap-2">
                    <Bookmark01Icon className="w-4 h-4" />
                    Browse Community
                  </Link>
                  <Link href="/library" className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:shadow-md transition-all flex items-center gap-2">
                    <NotebookIcon className="w-4 h-4" />
                    Go to Library
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mt-5">
                {filteredItems.map((item) => {
                  const meta = TYPE_META[item.type];
                  const Icon = meta.icon;
                  const removingKey = `${item.type}-${item.id}`;

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="rounded-2xl border border-border bg-surface hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 py-4">
                        <Link href={item.href} className="flex items-start gap-3 flex-1">
                          <div className="p-2.5 rounded-xl bg-background-muted border border-border">
                            <Icon className={`w-5 h-5 ${meta.tint}`} />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                              <ClayBadge variant={meta.badge} className="px-2.5 py-1 text-[11px]">
                                {meta.label}
                              </ClayBadge>
                            </div>
                            <p className="text-sm text-foreground-muted mt-1">{item.summary}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-foreground-muted">
                              <span>By {item.author}</span>
                              <span className="h-1 w-1 rounded-full bg-border" />
                              <span>Updated {item.updatedAt}</span>
                              <span className="h-1 w-1 rounded-full bg-border" />
                              <span>Saved {item.savedAtLabel}</span>
                            </div>
                          </div>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          {item.tags.map((tag) => (
                            <span
                              key={`${item.id}-${tag}`}
                              className="px-2.5 py-1 rounded-full bg-background-muted border border-border text-[11px] text-foreground-muted"
                            >
                              #{tag}
                            </span>
                          ))}
                          <ClayButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(item.type, item.id)}
                            disabled={removingId === removingKey || removeReferenceMutation.isPending}
                            className="flex items-center gap-2 text-xs"
                          >
                            <Bookmark01Icon className="w-4 h-4" />
                            {removingId === removingKey ? 'Removing' : 'Unsave'}
                          </ClayButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ClayCard>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-4 space-y-4 hidden lg:block">
          <ClayCard variant="default" padding="md" className="rounded-2xl">
            <div className="flex items-center gap-2">
              <Search01Icon className="w-5 h-5 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search saved materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-foreground-muted"
              />
            </div>
          </ClayCard>

          <ClayCard variant="default" padding="md" className="rounded-2xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                <FilterIcon className="w-4 h-4" />
                Type
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTER_OPTIONS.map((option) => {
                  const isActive = selectedType === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedType(option.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        isActive
                          ? 'bg-background-muted text-foreground border-border'
                          : 'text-foreground-muted border-transparent hover:text-foreground hover:border-border'
                      }`}
                    >
                      {option.label}
                      <span className="ml-2 text-[10px] text-foreground-muted">
                        {typeCounts[option.id]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </ClayCard>
        </div>
      </div>

      <MobileBottomSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filters"
        description="Refine saved materials"
        footer={(
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedType('all')}
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
              Type
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => {
                const isActive = selectedType === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedType(option.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
                      isActive
                        ? 'bg-background-muted text-foreground border-border'
                        : 'text-foreground-muted border-transparent hover:text-foreground hover:border-border'
                    }`}
                  >
                    {option.label}
                    <span className="ml-2 text-[10px] text-foreground-muted">
                      {typeCounts[option.id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background-muted p-3 text-xs text-foreground-muted">
            <div className="flex items-center justify-between">
              <span>Total</span>
              <span className="font-semibold text-foreground">{stats.total}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Showing</span>
              <span className="font-semibold text-foreground">{filteredItems.length}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
              <span className="px-2 py-1 rounded-full bg-surface border border-border">
                Notes {stats.notes}
              </span>
              <span className="px-2 py-1 rounded-full bg-surface border border-border">
                Flashcards {stats.flashcards}
              </span>
              <span className="px-2 py-1 rounded-full bg-surface border border-border">
                Exams {stats.exams}
              </span>
            </div>
          </div>
        </div>
      </MobileBottomSheet>
    </div>
  );
}

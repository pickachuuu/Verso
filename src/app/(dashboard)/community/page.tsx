'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ClayBadge, ClayCard } from '@/component/ui/Clay';
import MobileBottomSheet from '@/component/ui/MobileBottomSheet';
import { FilterIcon, Search01Icon, SparklesIcon } from 'hugeicons-react';
import { CommunityIcon, ExamIcon, FlashcardIcon, NotebookIcon } from '@/component/icons';
import { useCommunityItems, CommunityType, CommunityItem } from '@/hooks/useCommunity';


const FILTER_OPTIONS: { id: CommunityType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'note', label: 'Notes' },
  { id: 'flashcard', label: 'Flashcards' },
  { id: 'exam', label: 'Exams' }
];

const TYPE_META = {
  note: {
    label: 'Note',
    badge: 'accent',
    icon: NotebookIcon,
    tint: 'text-primary'
  },
  flashcard: {
    label: 'Flashcards',
    badge: 'success',
    icon: FlashcardIcon,
    tint: 'text-tertiary'
  },
  exam: {
    label: 'Exam',
    badge: 'warning',
    icon: ExamIcon,
    tint: 'text-secondary'
  }
} as const;

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CommunityType | 'all'>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { data: communityItems = [], isLoading, isError } = useCommunityItems();

  const filteredItems = useMemo(() => {
    let filtered = [...communityItems];

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
  }, [communityItems, searchQuery, selectedType]);

  const stats = useMemo(() => {
    return {
      total: communityItems.length,
      notes: communityItems.filter((item) => item.type === 'note').length,
      flashcards: communityItems.filter((item) => item.type === 'flashcard').length,
      exams: communityItems.filter((item) => item.type === 'exam').length
    };
  }, [communityItems]);

  const typeCounts = {
    all: stats.total,
    note: stats.notes,
    flashcard: stats.flashcards,
    exam: stats.exams
  };
  const activeFilters = Number(selectedType !== 'all');

  const trendingTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    communityItems.forEach((item) => {
      item.tags.forEach((tag) => {
        const key = tag.toLowerCase();
        tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [communityItems]);

  return (
    <div className="space-y-6">
      <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-3">
            <CommunityIcon className="w-12 h-12 text-primary shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Community</h1>
                <ClayBadge variant="accent" className="px-3 py-1.5 text-xs">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Shared
                </ClayBadge>
              </div>
              <p className="text-foreground-muted mt-1">
                Search shared notes, flashcards, and exams from the community.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/library"
              className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:shadow-md transition-all"
            >
              My Library
            </Link>
            <Link
              href="/flashcards"
              className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:shadow-md transition-all"
            >
              My Flashcards
            </Link>
            <Link
              href="/exams"
              className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:shadow-md transition-all"
            >
              My Exams
            </Link>
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
                  placeholder="Search community materials..."
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
                <h2 className="text-lg font-semibold text-foreground">Browse resources</h2>
                <p className="text-sm text-foreground-muted">
                  Showing {filteredItems.length} of {stats.total} shared materials
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground-muted">
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

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-2xl bg-background-muted border border-border flex items-center justify-center mx-auto mb-5">
                  <CommunityIcon className="w-9 h-9 text-foreground-muted animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Loading shared materials</h3>
                <p className="text-sm text-foreground-muted">Fetching the latest community resources.</p>
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
                  <CommunityIcon className="w-9 h-9 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Unable to load community</h3>
                <p className="text-sm text-foreground-muted">
                  Please try again in a moment.
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Image
                  src="/brand/verso-thinking-clean.svg"
                  alt="Verso mascot thinking"
                  width={100}
                  height={100}
                  className="mx-auto mb-5 drop-shadow-sm"
                />
                <h3 className="text-lg font-semibold text-foreground mb-2">No matches yet</h3>
                <p className="text-sm text-foreground-muted mb-5">
                  Try another keyword or switch resource types.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:shadow-md transition-all"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-3 mt-5">
                {filteredItems.map((item) => {
                  const meta = TYPE_META[item.type];
                  const Icon = meta.icon;
                  const authorInitials = item.author
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase() || 'U';

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="block rounded-2xl border border-border bg-surface hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 py-4">
                        <div className="flex items-start gap-3">
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
                              <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full overflow-hidden border border-border bg-background-muted flex items-center justify-center text-[10px] font-semibold text-foreground">
                                  {item.authorAvatarUrl ? (
                                    <img
                                      src={item.authorAvatarUrl}
                                      alt={item.author ? `${item.author} avatar` : 'User avatar'}
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <span>{authorInitials}</span>
                                  )}
                                </span>
                                <span>By {item.author}</span>
                              </div>
                              <span className="h-1 w-1 rounded-full bg-border" />
                              <span>Updated {item.updatedAt}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {item.tags.map((tag) => (
                            <span
                              key={`${item.id}-${tag}`}
                              className="px-2.5 py-1 rounded-full bg-background-muted border border-border text-[11px] text-foreground-muted"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
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
                placeholder="Search community materials..."
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

          <ClayCard variant="default" padding="md" className="rounded-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Community pulse</p>
                <span className="text-xs font-semibold text-primary">Active</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-border bg-background-muted px-2 py-3">
                  <p className="text-base font-semibold text-foreground">{stats.total}</p>
                  <p className="text-[10px] text-foreground-muted">Shared</p>
                </div>
                <div className="rounded-xl border border-border bg-background-muted px-2 py-3">
                  <p className="text-base font-semibold text-foreground">{stats.notes}</p>
                  <p className="text-[10px] text-foreground-muted">Notes</p>
                </div>
                <div className="rounded-xl border border-border bg-background-muted px-2 py-3">
                  <p className="text-base font-semibold text-foreground">{stats.flashcards}</p>
                  <p className="text-[10px] text-foreground-muted">Flashcards</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-2">
                  Trending topics
                </p>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.length === 0 ? (
                    <span className="text-xs text-foreground-muted">No topics yet</span>
                  ) : (
                    trendingTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="px-3 py-1.5 rounded-full bg-surface border border-border text-[11px] font-semibold text-foreground-muted hover:text-foreground hover:shadow-sm transition-all"
                      >
                        #{tag}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ClayCard>
        </div>
      </div>

      <MobileBottomSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filters"
        description="Refine community results"
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

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-2">
              Trending topics
            </p>
            <div className="flex flex-wrap gap-2">
              {trendingTags.length === 0 ? (
                <span className="text-xs text-foreground-muted">No topics yet</span>
              ) : (
                trendingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1.5 rounded-full bg-surface border border-border text-[11px] font-semibold text-foreground-muted hover:text-foreground hover:shadow-sm transition-all"
                  >
                    #{tag}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background-muted p-3 text-xs text-foreground-muted">
            <div className="flex items-center justify-between">
              <span>Shared</span>
              <span className="font-semibold text-foreground">{stats.total}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="rounded-xl border border-border bg-surface px-2 py-2">
                <p className="text-sm font-semibold text-foreground">{stats.notes}</p>
                <p className="text-[10px] text-foreground-muted">Notes</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-2 py-2">
                <p className="text-sm font-semibold text-foreground">{stats.flashcards}</p>
                <p className="text-[10px] text-foreground-muted">Flashcards</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-2 py-2">
                <p className="text-sm font-semibold text-foreground">{stats.exams}</p>
                <p className="text-[10px] text-foreground-muted">Exams</p>
              </div>
            </div>
          </div>
        </div>
      </MobileBottomSheet>
    </div>
  );
}

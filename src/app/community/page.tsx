'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MobileBottomSheet from '@/component/ui/MobileBottomSheet';
import { FilterIcon, Search01Icon, SparklesIcon } from 'hugeicons-react';
import { CommunityIcon, ExamIcon, FlashcardIcon, NotebookIcon } from '@/component/icons';
import { useCommunityItems, CommunityType } from '@/hooks/useCommunity';
import { MaterialCard } from '@/component/ui/MaterialCard';
import { useUserProfile } from '@/hooks/useAuth';

const FILTER_OPTIONS: { id: CommunityType | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'ALL TYPES', icon: <SparklesIcon className="w-5 h-5" /> },
  { id: 'note', label: 'NOTES', icon: <NotebookIcon className="w-5 h-5" /> },
  { id: 'flashcard', label: 'FLASHCARDS', icon: <FlashcardIcon className="w-5 h-5" /> },
  { id: 'exam', label: 'EXAMS', icon: <ExamIcon className="w-5 h-5" /> },
];

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CommunityType | 'all'>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { data: communityItems = [], isLoading, isError } = useCommunityItems();
  const { data: userProfile } = useUserProfile();
  const isLoggedIn = !!userProfile;

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

  const stats = useMemo(() => ({
    total: communityItems.length,
    notes: communityItems.filter((item) => item.type === 'note').length,
    flashcards: communityItems.filter((item) => item.type === 'flashcard').length,
    exams: communityItems.filter((item) => item.type === 'exam').length,
  }), [communityItems]);

  const typeCounts = { all: stats.total, note: stats.notes, flashcard: stats.flashcards, exam: stats.exams };
  const activeFilters = Number(selectedType !== 'all');

  const trendingTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    communityItems.forEach((item) => {
      item.tags.forEach((tag) => {
        const key = tag.toLowerCase();
        tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag]) => tag);
  }, [communityItems]);

  return (
    <div className="w-full max-w-7xl mx-auto pt-8 md:pt-4 pb-20 space-y-10 lg:space-y-14 px-2 md:px-0">
      
      {/* Hero Header */}
      <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2 md:mb-3">
            <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
            <h1 className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.3em] text-foreground/50">SHARED RESOURCES</h1>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-foreground leading-[0.85]">
            COMMUNITY
          </h2>
        </div>
        <div className="flex shrink-0 gap-3 pb-1 mt-2 md:mt-0 flex-wrap">
          {isLoggedIn ? (
            <>
              <Link href="/library" className="px-6 py-3 rounded-[2rem] bg-background-muted text-foreground font-black uppercase tracking-[0.2em] text-[11px] hover:bg-border/40 active:scale-95 transition-all">MY LIBRARY</Link>
              <Link href="/flashcards" className="px-6 py-3 rounded-[2rem] bg-background-muted text-foreground font-black uppercase tracking-[0.2em] text-[11px] hover:bg-border/40 active:scale-95 transition-all">MY FLASHCARDS</Link>
            </>
          ) : (
            <Link href="/auth" className="px-8 py-4 rounded-[2rem] bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] shadow-lg active:scale-95 transition-all">SIGN UP TO SHARE</Link>
          )}
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="lg:hidden flex flex-col gap-4 w-full text-foreground relative z-20">
        <div className="flex w-full items-stretch gap-3 h-[3.5rem]">
          <div className="flex-1 bg-background-muted rounded-[2rem] flex items-center px-5 gap-3 min-w-0">
            <Search01Icon className="w-5 h-5 opacity-40 shrink-0" />
            <input
              type="text"
              placeholder="SEARCH COMMUNITY..."
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
          <span>SHOWING {filteredItems.length} ITEM{filteredItems.length !== 1 ? 'S' : ''}</span>
          <span>{selectedType === 'all' ? 'ALL TYPES' : selectedType.toUpperCase()}</span>
        </div>
      </div>

      {/* Desktop Inline Toolbar */}
      <div className="hidden lg:flex flex-col gap-5 w-full relative z-20">
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 bg-background-muted rounded-[1.5rem] flex items-center px-5 gap-3 h-[3.25rem]">
            <Search01Icon className="w-5 h-5 opacity-40 shrink-0" />
            <input
              type="text"
              placeholder="SEARCH COMMUNITY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-[12px] font-black uppercase tracking-widest text-foreground placeholder:text-foreground/30 min-w-0"
            />
          </div>
          <div className="shrink-0 bg-foreground text-surface px-5 h-[3.25rem] rounded-[1.5rem] flex items-center gap-2">
            <span className="text-[22px] font-black tracking-tighter leading-none">{filteredItems.length}</span>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">/ {stats.total}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mr-1">TYPE</span>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedType(opt.id)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                  selectedType === opt.id ? 'bg-foreground text-surface shadow-md' : 'bg-background-muted text-foreground hover:bg-border/40'
                }`}
              >
                {opt.label} <span className="opacity-60">{typeCounts[opt.id]}</span>
              </button>
            ))}
          </div>

          {trendingTags.length > 0 && (
            <>
              <div className="w-px h-6 bg-foreground/10 mx-1" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mr-1">TRENDING</span>
                {trendingTags.slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-background-muted text-foreground hover:bg-foreground hover:text-surface transition-all"
                  >#{tag}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full relative z-10">
        {isLoading ? (
          <div className="w-full bg-background-muted rounded-[3rem] p-12 lg:p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-[1.5rem] bg-foreground/5 flex items-center justify-center mb-6">
              <CommunityIcon className="w-10 h-10 text-foreground/30 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">LOADING</h3>
            <p className="text-[11px] font-bold uppercase tracking-widest text-foreground/40">FETCHING COMMUNITY RESOURCES...</p>
          </div>
        ) : isError ? (
          <div className="w-full bg-foreground text-surface rounded-[3rem] p-12 text-center">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-3">ERROR LOADING</h3>
            <p className="opacity-60 text-[12px] font-bold uppercase tracking-widest">PLEASE TRY AGAIN IN A MOMENT.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="w-full bg-background-muted rounded-[3rem] p-10 lg:p-20 text-center flex flex-col items-center border-[6px] border-surface">
            <div className="w-32 h-32 mb-8 relative opacity-90 drop-shadow-xl saturate-50">
              <Image src="/brand/verso-empty-clean.svg" alt="Empty" fill className="object-contain" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-4">NO MATCHES</h3>
            <p className="opacity-60 mb-8 text-[12px] max-w-md font-bold uppercase tracking-widest leading-relaxed">TRY ANOTHER KEYWORD OR SWITCH MATERIAL TYPES.</p>
            <button onClick={() => { setSearchQuery(''); setSelectedType('all'); }} className="px-10 py-4 rounded-full bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] hover:scale-105 transition-all shadow-[0_12px_30px_rgba(0,0,0,0.15)]">CLEAR FILTERS</button>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <MaterialCard
                key={`${item.type}-${item.id}`}
                item={{ ...item, authorAvatarUrl: item.authorAvatarUrl || undefined }}
                wrapInLink={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      <MobileBottomSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="REFINE SEARCH"
        description="FILTER COMMUNITY RESOURCES"
        footer={(
          <div className="flex gap-3 w-full p-2">
            <button onClick={() => setSelectedType('all')} className="flex-1 py-4 rounded-[2rem] bg-background-muted text-foreground font-black uppercase tracking-[0.2em] text-[12px] active:scale-95 transition-all">RESET</button>
            <button onClick={() => setMobileFiltersOpen(false)} className="flex-[2] py-4 rounded-[2rem] bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.2)] active:scale-95 transition-all">APPLY</button>
          </div>
        )}
      >
        <div className="space-y-10 pt-4 pb-6 px-1">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 mb-5">MATERIAL TYPE</div>
            <div className="flex flex-col gap-3">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedType(opt.id)}
                  className={`flex items-center justify-between px-5 py-4 rounded-[2rem] transition-all shadow-sm ${
                    selectedType === opt.id ? 'bg-foreground text-surface' : 'bg-background-muted text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {opt.icon}
                    <span className="text-[12px] font-black uppercase tracking-widest">{opt.label}</span>
                  </div>
                  <span className="text-[11px] font-black opacity-60">{typeCounts[opt.id]}</span>
                </button>
              ))}
            </div>
          </div>

          {trendingTags.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 mb-5">TRENDING</div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <button key={tag} onClick={() => { setSearchQuery(tag); setMobileFiltersOpen(false); }} className="px-4 py-2.5 rounded-[1.5rem] bg-background-muted text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-surface transition-all">
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </MobileBottomSheet>
    </div>
  );
}

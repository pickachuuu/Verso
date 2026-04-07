'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import MobileBottomSheet from '@/component/ui/MobileBottomSheet';
import { FilterIcon, Search01Icon } from 'hugeicons-react';
import { NotebookIcon, FlashcardIcon, ExamIcon, SavedIcon } from '@/component/icons';
import { SavedMaterialType, useRemoveReference, useSavedMaterials } from '@/hooks/useSavedMaterials';
import { MaterialCard } from '@/component/ui/MaterialCard';

const FILTER_OPTIONS: { id: SavedMaterialType | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'ALL TYPES', icon: <SavedIcon className="w-5 h-5" /> },
  { id: 'note', label: 'NOTES', icon: <NotebookIcon className="w-5 h-5" /> },
  { id: 'flashcard', label: 'FLASHCARDS', icon: <FlashcardIcon className="w-5 h-5" /> },
  { id: 'exam', label: 'EXAMS', icon: <ExamIcon className="w-5 h-5" /> },
];

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

  const stats = useMemo(() => ({
    total: savedItems.length,
    notes: savedItems.filter((item) => item.type === 'note').length,
    flashcards: savedItems.filter((item) => item.type === 'flashcard').length,
    exams: savedItems.filter((item) => item.type === 'exam').length,
  }), [savedItems]);

  const typeCounts = { all: stats.total, note: stats.notes, flashcard: stats.flashcards, exam: stats.exams };
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
    <>
      <div className="w-full max-w-7xl mx-auto pt-8 md:pt-4 pb-20 space-y-10 lg:space-y-14 px-2 md:px-0">

        {/* Hero Header */}
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-2 md:mb-3">
              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
              <h1 className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.3em] text-foreground/50">PINNED MATERIALS</h1>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-foreground leading-[0.85]">
              SAVED
            </h2>
          </div>
          <div className="flex shrink-0 gap-3 pb-1 mt-2 md:mt-0 flex-wrap">
            <Link href="/community" className="px-6 py-3 rounded-[2rem] bg-background-muted text-foreground font-black uppercase tracking-[0.2em] text-[11px] hover:bg-border/40 active:scale-95 transition-all">BROWSE COMMUNITY</Link>
            <Link href="/library" className="px-6 py-3 rounded-[2rem] bg-background-muted text-foreground font-black uppercase tracking-[0.2em] text-[11px] hover:bg-border/40 active:scale-95 transition-all">MY LIBRARY</Link>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="lg:hidden flex flex-col gap-4 w-full text-foreground relative z-20">
          <div className="flex w-full items-stretch gap-3 h-[3.5rem]">
            <div className="flex-1 bg-background-muted rounded-[2rem] flex items-center px-5 gap-3 min-w-0">
              <Search01Icon className="w-5 h-5 opacity-40 shrink-0" />
              <input
                type="text"
                placeholder="SEARCH SAVED..."
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
                placeholder="SEARCH SAVED MATERIALS..."
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
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full relative z-10">
          {isLoading ? (
            <div className="w-full bg-background-muted rounded-[3rem] p-12 lg:p-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-[1.5rem] bg-foreground/5 flex items-center justify-center mb-6">
                <SavedIcon className="w-10 h-10 text-foreground/30 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">LOADING</h3>
              <p className="text-[11px] font-bold uppercase tracking-widest text-foreground/40">FETCHING YOUR SAVED MATERIALS...</p>
            </div>
          ) : isError ? (
            <div className="w-full bg-foreground text-surface rounded-[3rem] p-12 text-center">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-3">ERROR LOADING</h3>
              <p className="opacity-60 text-[12px] font-bold uppercase tracking-widest">PLEASE TRY AGAIN IN A MOMENT.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="w-full bg-background-muted rounded-[3rem] p-10 lg:p-20 text-center flex flex-col items-center border-[6px] border-surface">
              <div className="w-40 h-40 mb-10 relative opacity-90 drop-shadow-xl saturate-50">
                <Image src="/brand/verso-empty-clean.svg" alt="Empty" fill className="object-contain" />
              </div>
              <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-foreground mb-4">
                {savedItems.length === 0 ? 'BLANK SLATE' : 'NO MATCHES'}
              </h3>
              <p className="opacity-60 mb-10 text-[13px] max-w-md font-bold uppercase tracking-widest leading-relaxed">
                {savedItems.length === 0
                  ? 'SAVE ITEMS FROM THE COMMUNITY OR PUBLIC PREVIEWS TO PIN THEM HERE.'
                  : 'TRY ADJUSTING YOUR FILTERS TO FIND WHAT YOU\'RE LOOKING FOR.'
                }
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {savedItems.length === 0 ? (
                  <Link href="/community" className="px-8 py-4 rounded-[2rem] bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] shadow-lg active:scale-95 transition-all">
                    BROWSE COMMUNITY
                  </Link>
                ) : (
                  <button onClick={() => { setSearchQuery(''); setSelectedType('all'); }} className="px-10 py-4 rounded-full bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] hover:scale-105 transition-all shadow-[0_12px_30px_rgba(0,0,0,0.15)]">
                    CLEAR FILTERS
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const removingKey = `${item.type}-${item.id}`;
                return (
                  <MaterialCard
                    key={removingKey}
                    item={item}
                    actionSlot={
                      <button
                        onClick={() => handleRemove(item.type, item.id)}
                        disabled={removingId === removingKey || removeReferenceMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-[1rem] bg-background-muted hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] text-foreground/60 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                      >
                        <SavedIcon className="w-4 h-4" />
                        {removingId === removingKey ? 'REMOVING' : 'UNSAVE'}
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <MobileBottomSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="REFINE SEARCH"
        description="FILTER SAVED MATERIALS"
        footer={(
          <div className="flex gap-2 w-full">
            <button onClick={() => setSelectedType('all')} className="flex-1 py-3 rounded-xl bg-background-muted text-foreground font-black uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all hover:bg-border/40">RESET</button>
            <button onClick={() => setMobileFiltersOpen(false)} className="flex-[2] py-3 rounded-xl bg-foreground text-surface border border-foreground font-black uppercase tracking-[0.2em] text-[11px] shadow-sm active:scale-95 transition-all">APPLY</button>
          </div>
        )}
      >
        <div className="space-y-6 pt-2 pb-2 px-1">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 mb-3">MATERIAL TYPE</div>
            <div className="flex flex-col gap-2">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedType(opt.id)}
                  className={`flex items-center justify-between px-5 py-3.5 rounded-xl transition-all shadow-sm border ${
                    selectedType === opt.id ? 'bg-foreground text-surface border-foreground' : 'bg-background-muted text-foreground border-transparent hover:border-border/60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {opt.icon}
                    <span className="text-[11px] font-black uppercase tracking-widest">{opt.label}</span>
                  </div>
                  <span className="text-[11px] font-black opacity-60">{typeCounts[opt.id]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </MobileBottomSheet>
    </>
  );
}

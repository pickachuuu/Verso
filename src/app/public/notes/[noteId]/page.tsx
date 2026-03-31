'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import SaveMaterialModal from '@/component/features/modal/SaveMaterialModal';
import { useCopyPublicNote, useSaveReference } from '@/hooks/useSavedMaterials';
import {
  ArrowLeft01Icon,
  Bookmark01Icon,
  Menu01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  ArrowLeft02Icon
} from 'hugeicons-react';
import TableOfContents, { NotePage } from '@/component/ui/TableOfContents';
import NotebookPage from '@/component/ui/NotebookPage';
import { extractH1Title } from '@/hooks/useNotes';

const supabase = createClient();

interface PublicNote {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  cover_color: string | null;
  updated_at: string;
  created_at: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function PublicNotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params?.noteId as string;

  const [note, setNote] = useState<PublicNote | null>(null);
  const [pages, setPages] = useState<NotePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savingAction, setSavingAction] = useState<'reference' | 'copy' | null>(null);

  const [currentView, setCurrentView] = useState<'toc' | 'page'>('toc');
  const [currentPageIndex, setCurrentPageIndex] = useState<number | null>(null);

  const notebookContainerRef = useRef<HTMLDivElement>(null);
  const mobileTocRef = useRef<HTMLDivElement>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const saveReferenceMutation = useSaveReference();
  const copyNoteMutation = useCopyPublicNote();

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const update = () => setIsSmallScreen(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const fetchNote = async () => {
      if (!noteId) return;
      setLoading(true);

      try {
        const { data: noteData, error: noteError } = await supabase
          .from('notes')
          .select('id, title, content, tags, cover_color, updated_at, created_at')
          .eq('id', noteId)
          .eq('is_public', true)
          .single();

        if (noteError || !noteData) {
          setError('Note not found or not public');
          setLoading(false);
          return;
        }

        setNote(noteData);

        const { data: pagesData, error: pagesError } = await supabase
          .from('note_pages')
          .select('id, note_id, title, content, page_order, created_at, updated_at')
          .eq('note_id', noteId)
          .order('page_order', { ascending: true });

        if (pagesError) {
          console.error('Error loading note pages:', pagesError);
        }

        const resolvedPages = (pagesData || []) as NotePage[];
        setPages(resolvedPages);

        // Auto-select first page if it exists
        if (resolvedPages.length > 0) {
          setCurrentPageIndex(0);
          setCurrentView('page');
        }

        setLoading(false);
      } catch (err) {
        setError('An error occurred while loading this note');
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  const pagesToShow = useMemo<NotePage[]>(() => {
    if (!note) return [];
    if (pages.length > 0) return pages;
    if (!note.content?.trim()) return [];
    return [{
      id: `${note.id}-page-0`,
      note_id: note.id,
      title: extractH1Title(note.content),
      content: note.content,
      page_order: 0,
      created_at: note.created_at,
      updated_at: note.updated_at,
    }];
  }, [note, pages]);

  const theme = 'light' as const;
  const currentPage = currentPageIndex !== null ? pagesToShow[currentPageIndex] : null;
  const currentPageContent = currentPage?.content || '';

  const handlePageClick = useCallback((index: number) => {
    setCurrentPageIndex(index);
    setCurrentView('page');
  }, []);

  const handlePrev = useCallback(() => {
    if (currentView === 'page' && currentPageIndex !== null) {
      if (currentPageIndex === 0) {
        setCurrentView('toc');
        setCurrentPageIndex(null);
        return;
      }
      setCurrentPageIndex(currentPageIndex - 1);
      return;
    }
  }, [currentView, currentPageIndex]);

  const handleNext = useCallback(() => {
    if (currentView === 'toc') {
      if (pagesToShow.length === 0) return;
      setCurrentPageIndex(0);
      setCurrentView('page');
      return;
    }

    if (currentView === 'page' && currentPageIndex !== null) {
      if (currentPageIndex >= pagesToShow.length - 1) return;
      setCurrentPageIndex(currentPageIndex + 1);
    }
  }, [currentView, currentPageIndex, pagesToShow.length]);

  const handleSaveReference = async () => {
    if (!note) return;
    setSavingAction('reference');
    try {
      await saveReferenceMutation.mutateAsync({ itemType: 'note', itemId: note.id });
      setIsSaveModalOpen(false);
    } catch (error) {
      console.error('Error saving note reference:', error);
    } finally {
      setSavingAction(null);
    }
  };

  const handleSaveCopy = async () => {
    if (!note) return;
    setSavingAction('copy');
    try {
      const result = await copyNoteMutation.mutateAsync(note.id);
      setIsSaveModalOpen(false);
      router.push(`/library/${result.slug}`);
    } catch (error) {
      console.error('Error copying note:', error);
    } finally {
      setSavingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground-muted font-black uppercase tracking-[0.2em] text-[10px]">Loading note...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="w-full max-w-7xl mx-auto pt-8 md:pt-4 pb-20 px-2 md:px-0">
        <div className="w-full bg-background-muted rounded-[3rem] p-12 lg:p-20 text-center flex flex-col items-center border-[6px] border-surface">
          <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-foreground mb-4">
            NOTE NOT FOUND
          </h3>
          <p className="opacity-60 mb-10 text-[13px] max-w-md font-bold leading-relaxed uppercase tracking-widest leading-relaxed">
            {error || 'THIS NOTE IS NOT AVAILABLE FOR PUBLIC VIEWING.'}
          </p>
          <Link href="/community" className="px-10 py-5 rounded-full bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[13px] hover:scale-105 transition-all shadow-lg flex items-center gap-3">
            <ArrowLeft01Icon className="w-5 h-5" />
            BACK TO COMMUNITY
          </Link>
        </div>
      </div>
    );
  }

  const pageIndicator = currentView === 'page' && currentPageIndex !== null
    ? `Page ${currentPageIndex + 1} of ${pagesToShow.length}`
    : 'Table of Contents';

  const canGoPrev = currentView !== 'toc';
  const canGoNext = currentView === 'toc'
    ? pagesToShow.length > 0
    : currentPageIndex !== null && currentPageIndex < pagesToShow.length - 1;

  // Ported Mobile Layout Flow (Stack) from Editor
  if (isSmallScreen) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <header className="h-16 shrink-0 border-b border-border/40 bg-surface/95 backdrop-blur-xl flex items-center justify-between px-4 z-50 sticky top-0">
          <Link href="/community" className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-background-muted active:scale-90 transition-all text-foreground">
            <ArrowLeft02Icon className="w-5 h-5" />
          </Link>
          <div className="flex-1 px-4 flex flex-col items-center text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/50">COMMUNITY NOTE</span>
            <h2 className="text-sm font-black text-foreground tracking-tighter truncate uppercase w-full">
              {note.title || 'UNTITLED NOTEBOOK'}
            </h2>
          </div>
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-foreground text-surface active:scale-90 transition-all"
          >
            <Bookmark01Icon className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile Page Selector Horizontal Scroll */}
        <div ref={mobileTocRef} className="w-full bg-surface border-b border-border/40 py-3 px-4 overflow-x-auto scrollbar-hide flex items-center gap-2">
          <button
            onClick={() => setCurrentView('toc')}
            className={`shrink-0 h-10 px-4 rounded-[1rem] border-[2px] transition-all font-black text-[10px] uppercase tracking-widest
              ${currentView === 'toc' ? 'border-primary bg-primary text-surface shadow-md' : 'border-border/40 bg-background-muted text-foreground/70'}
            `}
          >
            CONTENTS
          </button>

          {pagesToShow.map((p, i) => (
            <button
              key={p.id}
              onClick={() => handlePageClick(i)}
              className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-[1rem] border-[2px] transition-all font-black text-sm
                ${currentView === 'page' && currentPageIndex === i ? 'border-primary bg-primary text-surface shadow-md' : 'border-border/40 bg-background-muted text-foreground/70'}
              `}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-surface p-4 pb-[20vh] overflow-y-auto">
          {currentView === 'toc' && (
            <div className="w-full min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TableOfContents
                notebookTitle={note.title || 'Untitled Notebook'}
                pages={pagesToShow}
                onPageClick={handlePageClick}
                onAddPage={() => { }}
                theme={theme}
                readOnly
              />
            </div>
          )}

          {currentView === 'page' && currentPageIndex !== null ? (
            <div className="w-full bg-surface shadow-xl rounded-[2rem] border border-border/20 overflow-hidden min-h-[70vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <NotebookPage
                content={currentPageContent}
                onChange={() => { }}
                theme={theme}
                readOnly={true}
                simpleMode={true}
                autoFocus={false}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Desktop Dual Pane Reader Layout (Inspired by Editor Dashboard)
  return (
    <div className="h-[100dvh] bg-background-muted/30 overflow-hidden flex w-full relative selection:bg-primary/20 dashboard-grid-bg">
      {/* LEFT PANE - Research/Context */}
      <aside className="w-[340px] xl:w-[420px] shrink-0 h-full flex flex-col bg-surface/80 backdrop-blur-3xl border-r border-border/40 shadow-[0_0_60px_rgba(0,0,0,0.03)] z-[20] overflow-y-auto scrollbar-hide">
        <div className="p-8 pb-6 border-b border-border/20 bg-surface">
          <Link
            href="/community"
            className="w-12 h-12 flex items-center justify-center rounded-[1.5rem] bg-background-muted border border-border/40 text-foreground hover:bg-foreground hover:text-surface transition-all active:scale-95 group mb-8 shadow-sm"
            title="Back to Community"
          >
            <ArrowLeft02Icon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </Link>

          <div className="flex flex-col mb-8 mt-4">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/50 block mb-2">COMMUNITY NOTE</span>
            <h2 className="text-3xl xl:text-4xl font-black text-foreground tracking-tighter uppercase leading-[0.9] break-words">
              {note.title || 'UNTITLED NOTEBOOK'}
            </h2>
            <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">
              {formatDate(note.created_at)}
            </div>
          </div>

          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="w-full flex justify-center items-center gap-3 px-6 py-4 rounded-[1.5rem] bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[11px] hover:bg-foreground/90 active:scale-95 transition-all shadow-lg"
          >
            <Bookmark01Icon className="w-4 h-4" />
            SAVE NOTE
          </button>
        </div>

        <div className="p-8 flex-1 flex flex-col gap-6 relative pb-12">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-2">
              <Menu01Icon className="w-4 h-4 text-primary" /> NOTE DIRECTORY
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest bg-foreground text-surface px-3 py-1 rounded-full">{pagesToShow.length} PAGES</span>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setCurrentView('toc')}
              className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all border-[3px]
                    ${currentView === 'toc'
                  ? 'bg-foreground border-foreground text-surface shadow-xl scale-[1.02]'
                  : 'bg-surface border-transparent hover:border-border/40 hover:bg-background-muted text-foreground'
                }
                  `}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-[1rem] text-[12px] font-black shrink-0 ${currentView === 'toc' ? 'bg-surface/20 text-surface' : 'bg-background-muted text-foreground'}`}>
                TC
              </div>
              <span className="text-[13px] font-black uppercase tracking-widest">Contents</span>
            </button>

            <div className="h-4" />

            {pagesToShow.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handlePageClick(i)}
                className={`group w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all border-[3px]
                      ${currentView === 'page' && currentPageIndex === i
                    ? 'bg-foreground border-foreground text-surface shadow-xl scale-[1.02]'
                    : 'bg-surface border-transparent hover:border-border/40 hover:bg-background-muted text-foreground'
                  }
                    `}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`w-10 h-10 flex items-center justify-center rounded-[1rem] text-[12px] font-black shrink-0 ${currentView === 'page' && currentPageIndex === i ? 'bg-surface/20 text-surface' : 'bg-background-muted text-foreground'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] font-black uppercase tracking-widest truncate">{p.title || 'UNTITLED PAGE'}</span>
                </div>
                {currentView === 'page' && currentPageIndex === i && <ArrowRight01Icon className="w-5 h-5 text-surface/50" />}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* RIGHT PANE - THE CANVAS (Reader) */}
      <section className="flex-1 h-full flex flex-col z-[10] relative">
        <header className="h-[100px] shrink-0 flex items-center justify-between px-8 lg:px-12">
          <div>
            <span className="text-[12px] font-black text-foreground/40 uppercase tracking-[0.3em]">Reader Mode</span>
          </div>

          <div className="flex items-center gap-4 bg-surface px-4 py-2 rounded-[1.5rem] border border-border/40 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{pageIndicator}</span>
            <div className="w-[2px] h-4 bg-border/20" />
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="p-1.5 rounded-lg hover:bg-background-muted disabled:opacity-30 transition-colors"
              >
                <ArrowLeft01Icon className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="p-1.5 rounded-lg hover:bg-background-muted disabled:opacity-30 transition-colors"
              >
                <ArrowRight01Icon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-32 scrollbar-hide">
          <div className="w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col items-center pt-8">

            {currentView === 'toc' && (
              <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TableOfContents
                  notebookTitle={note.title || 'Untitled Notebook'}
                  pages={pagesToShow}
                  onPageClick={handlePageClick}
                  onAddPage={() => { }}
                  theme={theme}
                  readOnly
                />
              </div>
            )}

            {currentView === 'page' && currentPageIndex !== null && (
              <div className="w-full bg-surface shadow-[0_30px_80px_rgba(0,0,0,0.08)] rounded-[3rem] border border-border/20 overflow-hidden min-h-[110vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 sm:p-12 xl:p-16 h-full flex flex-col">
                  <NotebookPage
                    content={currentPageContent}
                    onChange={() => { }}
                    theme={theme}
                    readOnly={true}
                    simpleMode={true}
                    autoFocus={false}
                  />
                </div>
              </div>
            )}

            {(!currentView || (currentView === 'page' && currentPageIndex === null)) && (
              <div className="w-full aspect-video border-[4px] border-dashed border-border/40 rounded-[4rem] flex flex-col items-center justify-center bg-surface/30 backdrop-blur-md">
                <BookOpen01Icon className="w-20 h-20 text-foreground/20 mb-6" />
                <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground/40">Canvas Empty</h2>
                <p className="text-[13px] font-black text-foreground/30 uppercase tracking-[0.3em] mt-3">Select a section from the directory</p>
              </div>
            )}

          </div>
        </div>
      </section>

      <SaveMaterialModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        itemType="note"
        title={note.title || 'Untitled Notebook'}
        onSaveReference={handleSaveReference}
        onSaveCopy={handleSaveCopy}
        savingAction={savingAction}
      />
    </div>
  );
}

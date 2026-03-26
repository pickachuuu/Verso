'use client';

import { useEffect, useMemo, useRef, useState, useCallback, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import SaveMaterialModal from '@/component/features/modal/SaveMaterialModal';
import { useCopyPublicNote, useSaveReference } from '@/hooks/useSavedMaterials';
import { ArrowLeft01Icon, Bookmark01Icon } from 'hugeicons-react';
import Button from '@/component/ui/Button';
import ClayNotebookCover, { NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import PageFlipContainer, { ViewType } from '@/component/ui/PageFlipContainer';
import TableOfContents, { NotePage } from '@/component/ui/TableOfContents';
import NotebookPage from '@/component/ui/NotebookPage';
import { useNotebookScale, NOTEBOOK_WIDTH, NOTEBOOK_HEIGHT } from '@/hooks/useNotebookScale';
import { extractH1Title } from '@/hooks/useNotes';
import { ClayCard } from '@/component/ui/Clay';

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

  const [currentView, setCurrentView] = useState<ViewType>('cover');
  const [currentPageIndex, setCurrentPageIndex] = useState<number | null>(null);
  const previousContentRef = useRef<ReactNode>(null);

  const notebookContainerRef = useRef<HTMLDivElement>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const rawScale = useNotebookScale(notebookContainerRef, { widthOnly: isSmallScreen });

  const saveReferenceMutation = useSaveReference();
  const copyNoteMutation = useCopyPublicNote();

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
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

        setPages((pagesData || []) as NotePage[]);
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
  const coverColor = (note?.cover_color as NotebookColorKey) || 'royal';
  const currentPage = currentPageIndex !== null ? pagesToShow[currentPageIndex] : null;
  const currentPageContent = currentPage?.content || '';

  const minScale = isSmallScreen ? 0 : 0.6;
  const scale = Math.max(rawScale, minScale);

  const captureCurrentState = useCallback(() => {
    if (currentView === 'cover') {
      previousContentRef.current = (
        <ClayNotebookCover
          mode="editor"
          title={note?.title || 'Untitled Notebook'}
          onTitleChange={() => { }}
          onOpen={() => { }}
          color={coverColor}
          theme={theme}
          readOnly
        />
      );
      return;
    }

    if (currentView === 'toc') {
      previousContentRef.current = (
        <TableOfContents
          notebookTitle={note?.title || 'Untitled Notebook'}
          pages={pagesToShow}
          onPageClick={() => { }}
          onAddPage={() => { }}
          theme={theme}
          readOnly
        />
      );
      return;
    }

    previousContentRef.current = (
      <NotebookPage
        content={currentPageContent}
        onChange={() => { }}
        theme={theme}
        readOnly
      />
    );
  }, [currentView, note?.title, coverColor, theme, pagesToShow, currentPageContent]);

  const handleOpenContents = useCallback(() => {
    captureCurrentState();
    setCurrentView('toc');
    setCurrentPageIndex(null);
  }, [captureCurrentState]);

  const handlePageClick = useCallback((index: number) => {
    captureCurrentState();
    setCurrentPageIndex(index);
    setCurrentView('page');
  }, [captureCurrentState]);

  const handlePrev = useCallback(() => {
    if (currentView === 'page' && currentPageIndex !== null) {
      captureCurrentState();
      if (currentPageIndex === 0) {
        setCurrentView('toc');
        setCurrentPageIndex(null);
        return;
      }
      setCurrentPageIndex(currentPageIndex - 1);
      return;
    }

    if (currentView === 'toc') {
      captureCurrentState();
      setCurrentView('cover');
      setCurrentPageIndex(null);
    }
  }, [captureCurrentState, currentView, currentPageIndex]);

  const handleNext = useCallback(() => {
    if (currentView === 'cover') {
      captureCurrentState();
      setCurrentView('toc');
      setCurrentPageIndex(null);
      return;
    }

    if (currentView === 'toc') {
      if (pagesToShow.length === 0) return;
      captureCurrentState();
      setCurrentPageIndex(0);
      setCurrentView('page');
      return;
    }

    if (currentView === 'page' && currentPageIndex !== null) {
      if (currentPageIndex >= pagesToShow.length - 1) return;
      captureCurrentState();
      setCurrentPageIndex(currentPageIndex + 1);
    }
  }, [captureCurrentState, currentView, currentPageIndex, pagesToShow.length]);

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
        <p className="text-foreground-muted">Loading note...</p>
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

  const coverComponent = (
    <ClayNotebookCover
      mode="editor"
      title={note.title || 'Untitled Notebook'}
      onTitleChange={() => { }}
      onOpen={handleOpenContents}
      color={coverColor}
      theme={theme}
      readOnly
    />
  );

  const tocComponent = (
    <TableOfContents
      notebookTitle={note.title || 'Untitled Notebook'}
      pages={pagesToShow}
      onPageClick={handlePageClick}
      onAddPage={() => { }}
      theme={theme}
      readOnly
    />
  );

  const pageComponent = (
    <NotebookPage
      content={currentPageContent}
      onChange={() => { }}
      theme={theme}
      readOnly
    />
  );

  const pageIndicator = currentView === 'page' && currentPageIndex !== null
    ? `Page ${currentPageIndex + 1} of ${pagesToShow.length}`
    : currentView === 'toc'
      ? 'Table of Contents'
      : 'Notebook Cover';

  const canGoPrev = currentView !== 'cover';
  const canGoNext = currentView !== 'page'
    ? !(currentView === 'toc' && pagesToShow.length === 0)
    : currentPageIndex !== null && currentPageIndex < pagesToShow.length - 1;

  return (
    <div className="w-full max-w-[90rem] mx-auto pt-8 md:pt-4 pb-20 px-4 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Left Sticky Pane */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-8 lg:sticky lg:top-8 h-fit z-20">
          {/* Hero Header */}
          <div className="w-full flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Link href="/community" className="px-4 py-2 rounded-full border-2 border-border/60 hover:bg-background-muted transition-all hidden sm:flex items-center gap-2">
                <ArrowLeft01Icon className="w-3.5 h-3.5" />
              </Link>
              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
              <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/50">COMMUNITY NOTE</h1>
            </div>
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter uppercase text-foreground leading-[0.85] break-words">
              {note.title || 'UNTITLED NOTEBOOK'}
            </h2>
            <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 break-words">
              {formatDate(note.created_at)}
            </div>

            <button onClick={() => setIsSaveModalOpen(true)} className="mt-2 w-full flex justify-center items-center gap-3 px-6 py-4 rounded-[2rem] bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[11px] hover:bg-foreground/90 active:scale-95 transition-all shadow-lg">
              <Bookmark01Icon className="w-4 h-4" />
              SAVE NOTE
            </button>
          </div>

          {/* Control Strip */}
          <div className="w-full bg-background-muted rounded-[2rem] p-5 flex flex-col gap-4">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/50 text-center">{pageIndicator}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="px-2 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest bg-surface border border-border/40 hover:border-foreground/20 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
              >
                PREV
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="px-2 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest bg-surface border border-border/40 hover:border-foreground/20 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
              >
                NEXT
              </button>
            </div>
            <button
              onClick={handleOpenContents}
              disabled={currentView === 'toc'}
              className="w-full px-2 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest bg-surface border border-border/40 hover:border-foreground/20 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
            >
              CONTENTS
            </button>
          </div>
        </div>

        {/* Right Scrolling Pane */}
        <div className="lg:col-span-8 xl:col-span-9 flex justify-center items-start lg:pt-8 min-h-[70vh] z-10 w-full overflow-hidden">
          <div ref={notebookContainerRef} className="relative w-full flex justify-center items-start overflow-visible pt-10">
          <div
            className="relative"
            style={{
              width: NOTEBOOK_WIDTH * scale,
              height: NOTEBOOK_HEIGHT * scale,
            }}
          >
            <div
              className="relative"
              style={{
                width: NOTEBOOK_WIDTH,
                height: NOTEBOOK_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <PageFlipContainer
                currentView={currentView}
                currentPageIndex={currentView === 'page' ? currentPageIndex : null}
                totalPages={pagesToShow.length}
                cover={coverComponent}
                toc={tocComponent}
                pageContent={pageComponent}
                previousContent={previousContentRef.current || undefined}
                theme={theme}
              />
            </div>
          </div>
        </div>
        </div>
      </div>

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

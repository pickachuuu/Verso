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
  const rawScale = useNotebookScale(notebookContainerRef);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

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
          onTitleChange={() => {}}
          onOpen={() => {}}
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
          onPageClick={() => {}}
          onAddPage={() => {}}
          theme={theme}
          readOnly
        />
      );
      return;
    }

    previousContentRef.current = (
      <NotebookPage
        content={currentPageContent}
        onChange={() => {}}
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
      <div className="space-y-6 max-w-4xl mx-auto px-4 py-8">
        <ClayCard variant="elevated" padding="lg" className="rounded-3xl text-center">
          <p className="text-foreground-muted">{error || 'This note is not available for public viewing.'}</p>
          <div className="mt-6 flex justify-center">
            <Link href="/community">
              <Button variant="outline">
                <ArrowLeft01Icon className="w-4 h-4 mr-2" />
                Back to Community
              </Button>
            </Link>
          </div>
        </ClayCard>
      </div>
    );
  }

  const coverComponent = (
    <ClayNotebookCover
      mode="editor"
      title={note.title || 'Untitled Notebook'}
      onTitleChange={() => {}}
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
      onAddPage={() => {}}
      theme={theme}
      readOnly
    />
  );

  const pageComponent = (
    <NotebookPage
      content={currentPageContent}
      onChange={() => {}}
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
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/community" className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors">
            <ArrowLeft01Icon className="w-4 h-4" />
            <span className="text-sm font-medium">Community</span>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setIsSaveModalOpen(true)}>
            <Bookmark01Icon className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>

        <ClayCard variant="default" padding="md" className="rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-foreground-muted">{pageIndicator}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-surface hover:bg-background-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={handleOpenContents}
                disabled={currentView === 'toc'}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-surface hover:bg-background-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Contents
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-surface hover:bg-background-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </ClayCard>

        <div ref={notebookContainerRef} className="relative w-full min-h-[70vh] flex justify-center">
          <div
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

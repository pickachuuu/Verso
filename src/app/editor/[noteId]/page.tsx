'use client';

import { useEffect, useLayoutEffect, useCallback, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// UI Components
import { EditorToolbar, Editor } from '@/component/ui/RichTextEditor';
import { TIPTAP_FORMATTING_GUIDE } from '@/component/ui/AISelectionBubble';
import ClayNotebookCover, { NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import NotebookPage from '@/component/ui/NotebookPage';
import TagsDropdown from '@/component/ui/TagsDropdown';
import { motion, AnimatePresence } from 'motion/react';

// Hooks
import { useAutoPageBreak } from '@/hooks/useAutoPageBreak';

// Icons
import {
  Tick01Icon,
  Loading03Icon,
  AlertCircleIcon,
  Menu01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  Add01Icon,
  GoogleGeminiIcon,
  PencilEdit02Icon,
  NoteIcon,
  SummationCircleIcon,
  FlashIcon,
  BookOpen01Icon,
  Delete02Icon
} from 'hugeicons-react';

// Stores
import { useEditorStore, useNoteStore, useUIStore } from '@/stores/editorStore';

// TanStack Query hooks
import {
  useNote,
  useNotePages,
  useCreateNote,
  useSaveNote,
  useCreatePage,
  useSavePage,
  useDeletePage,
  extractH1Title,
} from '@/hooks/useNotes';
import TableOfContents, { NotePage } from '@/component/ui/TableOfContents';

const ROMAN_NUMERALS = [
  { value: 10, symbol: 'X' },
  { value: 9, symbol: 'IX' },
  { value: 5, symbol: 'V' },
  { value: 4, symbol: 'IV' },
  { value: 1, symbol: 'I' },
];

function toRoman(num: number): string {
  let result = '';
  for (const { value, symbol } of ROMAN_NUMERALS) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

function fromRoman(roman: string): number {
  let result = 0;
  let s = roman;
  for (const { value, symbol } of ROMAN_NUMERALS) {
    while (s.startsWith(symbol)) {
      result += value;
      s = s.slice(symbol.length);
    }
  }
  return result;
}

function getNextContinuationTitle(currentTitle: string): string {
  const romanMatch = currentTitle.match(/(.*)\s([IVX]+)$/i);
  if (romanMatch) {
    const baseTitle = romanMatch[1];
    const currentRoman = romanMatch[2].toUpperCase();
    const currentNumber = fromRoman(currentRoman);
    if (currentNumber > 0) {
      return `${baseTitle} ${toRoman(currentNumber + 1)}`;
    }
  }
  return `${currentTitle} II`;
}

const EMPTY_PAGES: NotePage[] = [];

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteIdOrSlug = params?.noteId as string | undefined;
  const isNewNote = !noteIdOrSlug || noteIdOrSlug === 'new';
  const initializedRef = useRef<string | null>(null);
  const autoOpenedNoteIdRef = useRef<string | null>(null);
  const mobileTocRef = useRef<HTMLDivElement>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const update = () => setIsSmallScreen(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const {
    currentView,
    currentPageIndex,
    currentPageContent,
    lastSavedContent,
    editor,
    setCurrentView,
    setCurrentPageIndex,
    setCurrentPageContent,
    setLastSavedContent,
    setEditor,
    navigateToTOC,
    reset: resetEditor,
  } = useEditorStore();

  const {
    id: noteId,
    slug,
    title,
    tags,
    coverColor,
    setId,
    setSlug,
    setTitle,
    setCoverColor,
    setNoteData,
    reset: resetNote,
    addTag,
    removeTag,
  } = useNoteStore();

  const {
    saveStatus,
    showTagInput,
    tagInput,
    setSaveStatus,
    setShowTagInput,
    setTagInput,
    reset: resetUI,
  } = useUIStore();

  const theme = 'light' as const;

  useEffect(() => {
    const currentRoute = isNewNote ? 'new' : noteIdOrSlug;
    if (initializedRef.current !== currentRoute) {
      if (isNewNote) {
        resetEditor();
        resetNote();
        resetUI();
      } else if (currentRoute !== slug && currentRoute !== noteId) {
        // If the URL noteId/slug doesn't match the current state's id or slug, it's a completely different note
        resetEditor();
        resetNote();
        resetUI();
      }
      initializedRef.current = currentRoute || null;
    }
  }, [isNewNote, noteIdOrSlug, slug, noteId, resetEditor, resetNote, resetUI]);

  const queryClient = useQueryClient();
  const { data: fetchedNote, isLoading: isLoadingNote } = useNote(noteIdOrSlug);
  const resolvedNoteId = fetchedNote?.id ?? noteId;
  const { data: pagesData, isLoading: isLoadingPages, refetch: refetchPages } = useNotePages(resolvedNoteId);
  const pages = pagesData || EMPTY_PAGES;

  const createNoteMutation = useCreateNote();
  const saveNoteMutation = useSaveNote();
  const createPageMutation = useCreatePage();
  const savePageMutation = useSavePage();
  const deletePageMutation = useDeletePage();

  const { mutateAsync: savePageAsync } = savePageMutation;
  const { mutateAsync: saveNoteAsync } = saveNoteMutation;
  const { mutateAsync: createPageAsync } = createPageMutation;

  useEffect(() => {
    if (fetchedNote) {
      setNoteData({
        id: fetchedNote.id,
        slug: fetchedNote.slug,
        title: fetchedNote.title || '',
        tags: fetchedNote.tags || [],
        coverColor: (fetchedNote.cover_color as NotebookColorKey) || 'royal',
      });
      if (fetchedNote.slug && noteIdOrSlug === fetchedNote.id) {
        router.replace(`/editor/${fetchedNote.slug}`, { scroll: false });
      }
    }
  }, [fetchedNote, noteIdOrSlug, router, setNoteData]);

  // If we have pages, ensure we always default to page 0 on initial load, but allow users to navigate back to TOC manually
  useEffect(() => {
    if (pages.length > 0 && currentPageIndex === null && noteId) {
      if (autoOpenedNoteIdRef.current !== noteId) {
        setCurrentPageIndex(0);
        setCurrentPageContent(pages[0].content || '');
        setLastSavedContent(pages[0].content || '');
        setCurrentView('page');
        autoOpenedNoteIdRef.current = noteId;
      }
    }
  }, [pages, currentPageIndex, noteId, setCurrentPageIndex, setCurrentPageContent, setLastSavedContent, setCurrentView]);

  // Keep Add Page button visible by scrolling right when pages are loaded or added
  useEffect(() => {
    if (isSmallScreen && mobileTocRef.current) {
      setTimeout(() => {
        mobileTocRef.current?.scrollTo({ left: mobileTocRef.current.scrollWidth, behavior: 'smooth' });
      }, 50);
    }
  }, [pages.length, isSmallScreen]);

  useEffect(() => {
    const migrateContentToPage = async () => {
      if (noteId && pages.length === 0 && fetchedNote?.content?.trim()) {
        const pageId = await createPageAsync({ noteId, pageOrder: 0 });
        if (pageId) {
          const pageTitle = extractH1Title(fetchedNote.content);
          await savePageAsync({ pageId, title: pageTitle, content: fetchedNote.content });
          refetchPages();
        }
      }
    };
    migrateContentToPage();
  }, [noteId, pages.length, fetchedNote?.content, createPageAsync, savePageAsync, refetchPages]);

  const forceSaveCurrentPage = useCallback(async () => {
    if (currentPageIndex !== null && pages[currentPageIndex] && currentPageContent !== lastSavedContent) {
      const page = pages[currentPageIndex];
      try {
        const pageTitle = extractH1Title(currentPageContent);
        await savePageAsync({ pageId: page.id, title: pageTitle, content: currentPageContent });
        setLastSavedContent(currentPageContent);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }
  }, [currentPageIndex, pages, currentPageContent, lastSavedContent, savePageAsync, setLastSavedContent, setSaveStatus]);

  const handleEditorReady = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
  }, [setEditor]);

  const handleBack = useCallback(async () => {
    await forceSaveCurrentPage();
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/library');
  }, [router, forceSaveCurrentPage]);

  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const callAI = useCallback(async (systemPrompt: string, userContent: string): Promise<string> => {
    const res = await fetch('/api/ai/editor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userContent }),
    });
    if (!res.ok) throw new Error('AI request failed');
    const data = await res.json();
    return data?.text || '';
  }, []);

  const handleAIAction = useCallback(async (action: string) => {
    if (!editor || aiLoading) return;
    const textContent = editor.getText();
    setAiLoading(action);
    try {
      let result = '';
      const cleanAIResult = (raw: string) => raw.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

      switch (action) {
        case 'continue_writing': {
          result = await callAI(`You are a writing assistant. ${TIPTAP_FORMATTING_GUIDE}`, textContent);
          editor.chain().focus('end').insertContent(cleanAIResult(result)).run();
          break;
        }
        case 'generate_outline': {
          result = await callAI(`Generate an outline. ${TIPTAP_FORMATTING_GUIDE}`, textContent);
          editor.chain().focus('end').insertContent(cleanAIResult(result)).run();
          break;
        }
        case 'summarize_page': {
          result = await callAI(`Provide summary. ${TIPTAP_FORMATTING_GUIDE}`, textContent);
          editor.chain().focus('end').insertContent(`<hr>${cleanAIResult(result)}`).run();
          break;
        }
      }
    } finally {
      setAiLoading(null);
    }
  }, [editor, aiLoading, callAI]);

  const handleAddPage = async () => {
    if (!noteId) {
      // Create Note first
      try {
        const { id: newId, slug: newSlug } = await createNoteMutation.mutateAsync({ title, coverColor });
        setId(newId);
        setSlug(newSlug);
        const pageId = await createPageMutation.mutateAsync({ noteId: newId });
        if (pageId) {
          router.replace(`/editor/${newSlug}`, { scroll: false });
        }
      } catch { }
      return;
    }
    
    // Save current page synchronously to prevent data loss
    await forceSaveCurrentPage();
    
    // Optimistic UI updates
    try {
      createPageMutation.mutate({ noteId });
      setCurrentPageIndex(pages.length);
      setCurrentPageContent('');
      setLastSavedContent('');
      setCurrentView('page');
    } catch { }
  };

  const handlePageClick = async (pageIndex: number) => {
    await forceSaveCurrentPage();
    const page = pages[pageIndex];
    if (page) {
      setCurrentPageIndex(pageIndex);
      setCurrentPageContent(page.content || '');
      setLastSavedContent(page.content || '');
      setCurrentView('page');
      if (isSmallScreen) {
        setCurrentView('page'); // Just extra safety
      }
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) return;
    try { await deletePageMutation.mutateAsync(pageId); } catch { }
  };

  const handleAutoPageBreak = useCallback(async (overflowHTML: string, trimmedHTML: string) => {
    if (!noteId) return;
    setCurrentPageContent(trimmedHTML);
    const currentTitle = extractH1Title(trimmedHTML);
    if (currentPageIndex !== null && pages[currentPageIndex]) {
      const page = pages[currentPageIndex];
      try {
        await savePageAsync({ pageId: page.id, title: currentTitle, content: trimmedHTML });
        setLastSavedContent(trimmedHTML);
      } catch { }
    }
    try {
      const pageId = await createPageAsync({ noteId });
      if (pageId) {
        let overflowTitle = extractH1Title(overflowHTML);
        let finalOverflowHTML = overflowHTML;
        if (overflowTitle === 'Untitled Page' && currentTitle !== 'Untitled Page') {
          overflowTitle = getNextContinuationTitle(currentTitle);
          finalOverflowHTML = `<h1>${overflowTitle}</h1>${overflowHTML}`;
        }
        await savePageAsync({ pageId, title: overflowTitle, content: finalOverflowHTML });
        const updatedPages = (await refetchPages()).data || [];
        setCurrentPageIndex(updatedPages.length - 1);
        setCurrentPageContent(finalOverflowHTML);
        setLastSavedContent(finalOverflowHTML);
      }
    } catch { }
  }, [noteId, currentPageIndex, pages, savePageMutation, createPageMutation, refetchPages, setCurrentPageContent, setLastSavedContent, setCurrentPageIndex]);

  useAutoPageBreak({ editor, enabled: currentView === 'page' && !isSmallScreen, onOverflow: handleAutoPageBreak });

  useEffect(() => {
    if (currentView !== 'page' || currentPageIndex === null || !pages[currentPageIndex]) return;
    if (currentPageContent === lastSavedContent) return;

    if (useUIStore.getState().saveStatus !== 'saving') {
      setSaveStatus('saving');
    }

    const timeoutId = setTimeout(async () => {
      try {
        const page = pages[currentPageIndex];
        const pageTitle = extractH1Title(currentPageContent);
        await savePageAsync({ pageId: page.id, title: pageTitle, content: currentPageContent });
        setLastSavedContent(currentPageContent);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [currentPageContent, currentPageIndex, pages, lastSavedContent, currentView, setSaveStatus, setLastSavedContent, savePageAsync]);

  useEffect(() => {
    if (!noteId || !title.trim()) return;
    const timeoutId = setTimeout(async () => {
      try {
        const newSlug = await saveNoteAsync({ id: noteId, title, content: '', tags, coverColor });
        if (newSlug && newSlug !== slug) {
          setSlug(newSlug);
          router.replace(`/editor/${newSlug}`, { scroll: false });
        }
      } catch { }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [noteId, title, tags, coverColor, slug, router, setSlug, saveNoteAsync]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag) {
      addTag(trimmedTag);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setShowTagInput(false);
      setTagInput('');
    }
  };

  const aiButtons = [
    { id: 'continue_writing', label: 'CONTINUE', icon: PencilEdit02Icon, title: 'AI continues' },
    { id: 'generate_outline', label: 'OUTLINE', icon: NoteIcon, title: 'Generate structure' },
    { id: 'summarize_page', label: 'SUMMARY', icon: SummationCircleIcon, title: 'Summarize page' },
    { id: 'generate_flashcards', label: 'CARDS', icon: FlashIcon, title: 'Generate flashcards' },
  ] as const;

  const aiToolbarSlot = (
    <div className="flex items-center gap-1.5 ml-2">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary pr-3 border-r border-border/20 mr-1 shrink-0">
        <GoogleGeminiIcon className="w-4 h-4" />
        <span className="hidden xl:inline">AI ASSIST</span>
      </div>
      {aiButtons.map((action) => {
        const Icon = action.icon;
        const isLoading = aiLoading === action.id;
        return (
          <button
            key={action.id}
            onClick={() => handleAIAction(action.id)}
            disabled={!editor || Boolean(aiLoading)}
            title={action.title}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[1rem] text-[10px] sm:text-[11px] font-black bg-primary/5 hover:bg-primary/10 text-primary transition-all disabled:opacity-30 uppercase tracking-widest hover:scale-105 active:scale-95 border border-primary/20"
          >
            {isLoading ? <Loading03Icon className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
            <span className="hidden md:inline">{action.label}</span>
          </button>
        );
      })}
    </div>
  );

  const saveStatusIndicator = (
    <div className="flex items-center gap-2 select-none h-8 px-4 rounded-[1.25rem] bg-surface border border-border/40 shadow-sm ml-auto">
      <AnimatePresence mode="wait">
        {saveStatus === 'saving' ? (
          <motion.div key="saving" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2">
            <Loading03Icon className="w-3.5 h-3.5 text-foreground animate-spin" />
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest hidden sm:block">Syncing</span>
          </motion.div>
        ) : saveStatus === 'saved' ? (
          <motion.div key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
            <Tick01Icon className="w-3.5 h-3.5 text-foreground/40" />
            <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest hidden sm:block">Cloud Synced</span>
          </motion.div>
        ) : saveStatus === 'error' ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <AlertCircleIcon className="w-3.5 h-3.5 text-red-600" />
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest hidden sm:block">Offline</span>
          </motion.div>
        ) : <div className="w-6" />}
      </AnimatePresence>
    </div>
  );

  if (!isNewNote && (isLoadingNote || (!!resolvedNoteId && isLoadingPages))) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loading03Icon className="w-10 h-10 text-primary animate-spin" />
          <p className="text-foreground-muted font-black uppercase tracking-[0.2em] text-[10px]">PREPARING WORKSPACE</p>
        </div>
      </div>
    );
  }

  // Mobile Layout Flow (Stack)
  if (isSmallScreen) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <header className="h-16 shrink-0 border-b border-border/40 bg-surface/95 backdrop-blur-xl flex items-center justify-between px-4 z-50 sticky top-0">
          <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-background-muted active:scale-90 transition-all text-foreground">
            <ArrowLeft02Icon className="w-5 h-5" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center text-center">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/50">NOTEBOOK</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-center text-sm font-black bg-transparent border-none focus:outline-none placeholder:text-foreground/30 text-foreground tracking-tighter truncate uppercase"
                placeholder="UNTITLED NOTEBOOK"
              />
            </div>
          </div>
          {saveStatusIndicator}
        </header>

        {/* Mobile TOC Horizontal Scroll */}
        <div ref={mobileTocRef} className="w-full bg-surface border-b border-border/40 py-3 px-4 overflow-x-auto scrollbar-hide flex items-center gap-2">
          <button
            onClick={() => navigateToTOC()}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-[1rem] border-[2px] transition-all border-border/40 bg-foreground text-surface hover:bg-foreground/90 shadow-sm"
          >
            <Menu01Icon className="w-5 h-5" />
          </button>
          
          {pages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => handlePageClick(i)}
              className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-[1rem] border-[2px] transition-all font-black text-sm
                      ${currentPageIndex === i ? 'border-primary bg-primary text-surface shadow-md scale-105' : 'border-border/40 bg-background-muted text-foreground/70 hover:bg-background-muted/80'}
                   `}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}

          <button onClick={handleAddPage} className="shrink-0 w-10 h-10 rounded-[1rem] border-2 border-dashed border-primary/40 text-primary flex items-center justify-center bg-primary/5 ml-1 hover:bg-primary/10 transition-colors">
            <Add01Icon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 bg-surface p-4 pb-[20vh]">
          {editor && (
            <div className="sticky top-0 z-[60] bg-surface/90 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 border-b border-border/20 mb-4">
              <EditorToolbar editor={editor} fullscreen={false} />
            </div>
          )}
          {currentPageIndex !== null && pages[currentPageIndex] ? (
            <NotebookPage content={currentPageContent} onChange={setCurrentPageContent} theme={theme} onEditorReady={handleEditorReady} simpleMode={true} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[60vh]">
              <TableOfContents
                notebookTitle={title || 'UNTITLED NOTEBOOK'}
                pages={pages}
                onPageClick={handlePageClick}
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage}
                theme={theme}
                readOnly={false}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Massive Desktop Dual Pane Dashboard Layout
  return (
    <div className="h-[100dvh] bg-background-muted/30 overflow-hidden flex w-full relative selection:bg-primary/20 dashboard-grid-bg">
      {/*
        ====================================================================
        LEFT PANE - NOTEBOOK CONTEXT (Cover, Title, Elements, TOC)
        ====================================================================
      */}
      <aside className="w-[340px] xl:w-[420px] shrink-0 h-full flex flex-col bg-surface/80 backdrop-blur-3xl border-r border-border/40 shadow-[0_0_60px_rgba(0,0,0,0.03)] z-[20] overflow-y-auto scrollbar-hide">
        <div className="p-8 pb-6 border-b border-border/20 bg-surface">
          <button
            onClick={handleBack}
            className="w-12 h-12 flex items-center justify-center rounded-[1.5rem] bg-background-muted border border-border/40 text-foreground hover:bg-foreground hover:text-surface transition-all active:scale-95 group mb-8 shadow-sm"
            title="Back to Library"
          >
            <ArrowLeft02Icon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>

          <div className="flex flex-col mb-8 mt-4">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/50 block mb-2">NOTEBOOK</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl xl:text-4xl font-black bg-transparent border-none focus:outline-none placeholder:text-foreground/30 text-foreground tracking-tighter truncate uppercase pb-1"
              placeholder="UNTITLED NOTEBOOK"
            />
          </div>

          <TagsDropdown
            tags={tags}
            onRemoveTag={removeTag}
            onAddTag={handleAddTag}
            showTagInput={showTagInput}
            tagInput={tagInput}
            onTagInputChange={setTagInput}
            onTagInputKeyDown={handleTagKeyDown}
            onTagInputBlur={() => { if (tagInput.trim()) handleAddTag(); setTimeout(() => setShowTagInput(false), 150); }}
            onAddTagClick={() => setShowTagInput(true)}
          />
        </div>

        <div className="p-8 flex-1 flex flex-col gap-6 relative pb-12">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-2">
              <Menu01Icon className="w-4 h-4 text-primary" /> PAGES DIRECTORY
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest bg-foreground text-surface px-3 py-1 rounded-full">{pages.length} PAGES</span>
          </div>

          <div className="flex flex-col gap-3">
            {pages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handlePageClick(i)}
                className={`group w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all border-[3px]
                      ${currentPageIndex === i
                    ? 'bg-foreground border-foreground text-surface shadow-xl scale-[1.02]'
                    : 'bg-surface border-transparent hover:border-border/40 hover:bg-background-muted text-foreground'
                  }
                    `}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`w-10 h-10 flex items-center justify-center rounded-[1rem] text-[12px] font-black shrink-0 ${currentPageIndex === i ? 'bg-surface/20 text-surface' : 'bg-background-muted text-foreground'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] font-black uppercase tracking-widest truncate">{p.title || 'UNTITLED PAGE'}</span>
                </div>
                {currentPageIndex === i && <ArrowRight01Icon className="w-5 h-5 text-surface/50" />}
                {currentPageIndex !== i && (
                  <div
                    onClick={(e) => { e.stopPropagation(); handleDeletePage(p.id); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-red-500/0 group-hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Delete02Icon className="w-4 h-4" />
                  </div>
                )}
              </button>
            ))}

            <button
              onClick={handleAddPage}
              className="w-full mt-2 py-5 border-[3px] border-dashed border-border/80 rounded-[1.5rem] flex items-center justify-center gap-3 text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-background-muted hover:border-foreground/20 active:scale-[0.98] transition-all"
            >
              <Add01Icon className="w-5 h-5" /> NEW PAGE
            </button>
          </div>
        </div>
      </aside>

      {/*
        ====================================================================
        RIGHT PANE - THE CANVAS (Editor)
        ====================================================================
      */}
      <section className="flex-1 h-full flex flex-col z-[10] relative">
        <header className="h-[100px] shrink-0 flex items-center justify-between px-8 lg:px-12 pointer-events-none">
          <div className="pointer-events-auto">
            <span className="text-[12px] font-black text-foreground/40 uppercase tracking-[0.3em]">Editor Canvas</span>
          </div>
          <div className="pointer-events-auto">
            {saveStatusIndicator}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-12 scrollbar-hide">
          <div className="w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col items-center">

            {currentPageIndex !== null && pages[currentPageIndex] ? (
              <div className="w-full bg-surface shadow-[0_30px_80px_rgba(0,0,0,0.08)] rounded-[3rem] border border-border/20 overflow-hidden relative min-h-[95vh] mb-24">
                {editor && (
                  <div className="sticky top-0 z-[60] bg-surface/95 backdrop-blur-xl border-b-[3px] border-background-muted">
                    <EditorToolbar editor={editor} fullscreen trailingSlot={aiToolbarSlot} />
                  </div>
                )}
                <div className="p-8 sm:p-12 xl:p-16 h-full flex flex-col">
                  <NotebookPage content={currentPageContent} onChange={setCurrentPageContent} theme={theme} onEditorReady={handleEditorReady} simpleMode={true} />
                  <div className="flex-1 mt-32" />{/* Adds extra visual space at the bottom to scroll past content */}
                </div>
              </div>
            ) : (
              <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TableOfContents
                  notebookTitle={title || 'UNTITLED NOTEBOOK'}
                  pages={pages}
                  onPageClick={handlePageClick}
                  onAddPage={handleAddPage}
                  onDeletePage={handleDeletePage}
                  theme={theme}
                  readOnly={false}
                />
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  );
}

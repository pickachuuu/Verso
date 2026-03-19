'use client';

import { useEffect, useLayoutEffect, useCallback, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// UI Components
import { EditorToolbar, Editor } from '@/component/ui/RichTextEditor';
import { TIPTAP_FORMATTING_GUIDE } from '@/component/ui/AISelectionBubble';
import ClayNotebookCover, { NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import TableOfContents from '@/component/ui/TableOfContents';
import NotebookPage from '@/component/ui/NotebookPage';
import EditorSidebar from '@/component/ui/EditorSidebar';
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
  Add01Icon,
  GoogleGeminiIcon,
  PencilEdit02Icon,
  NoteIcon,
  SummationCircleIcon,
  FlashIcon,
  BookOpen01Icon,
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

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteIdOrSlug = params?.noteId as string | undefined;
  const isNewNote = !noteIdOrSlug || noteIdOrSlug === 'new';
  const initializedRef = useRef<string | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const update = () => setIsSmallScreen(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      }
      initializedRef.current = currentRoute || null;
    }
  }, [isNewNote, noteIdOrSlug, resetEditor, resetNote, resetUI]);

  const queryClient = useQueryClient();
  const { data: fetchedNote, isLoading: isLoadingNote } = useNote(noteIdOrSlug);
  const resolvedNoteId = fetchedNote?.id ?? noteId;
  const { data: pages = [], isLoading: isLoadingPages, refetch: refetchPages } = useNotePages(resolvedNoteId);

  const createNoteMutation = useCreateNote();
  const saveNoteMutation = useSaveNote();
  const createPageMutation = useCreatePage();
  const savePageMutation = useSavePage();
  const deletePageMutation = useDeletePage();

  useEffect(() => {
    if (fetchedNote) {
      setNoteData({
        id: fetchedNote.id,
        slug: fetchedNote.slug,
        title: fetchedNote.title || '',
        tags: fetchedNote.tags || [],
        coverColor: (fetchedNote.cover_color as NotebookColorKey) || 'royal',
      });
      setCurrentView('toc');
      if (fetchedNote.slug && noteIdOrSlug === fetchedNote.id) {
        router.replace(`/editor/${fetchedNote.slug}`, { scroll: false });
      }
    }
  }, [fetchedNote, noteIdOrSlug, router, setNoteData, setCurrentView]);

  useEffect(() => {
    const migrateContentToPage = async () => {
      if (noteId && pages.length === 0 && fetchedNote?.content?.trim()) {
        const pageId = await createPageMutation.mutateAsync({ noteId, pageOrder: 0 });
        if (pageId) {
          const pageTitle = extractH1Title(fetchedNote.content);
          await savePageMutation.mutateAsync({ pageId, title: pageTitle, content: fetchedNote.content });
          refetchPages();
        }
      }
    };
    migrateContentToPage();
  }, [noteId, pages.length, fetchedNote?.content, createPageMutation, savePageMutation, refetchPages]);

  const handleEditorReady = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
  }, [setEditor]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/library');
  }, [router]);

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

  const handleOpenNotebook = async () => {
    if (!title.trim()) return;
    if (!noteId && isNewNote) {
      try {
        const { id: newId, slug: newSlug } = await createNoteMutation.mutateAsync({ title, coverColor });
        setId(newId);
        setCurrentView('toc');
        setSlug(newSlug);
        router.replace(`/editor/${newSlug}`, { scroll: false });
      } catch (error) {}
    } else {
      setCurrentView('toc');
    }
  };

  const handleAddPage = async () => {
    if (!noteId) return;
    try {
      const pageId = await createPageMutation.mutateAsync({ noteId });
      if (pageId) {
        const updatedPages = (await refetchPages()).data || [];
        setCurrentPageIndex(updatedPages.length - 1);
        setCurrentPageContent('');
        setLastSavedContent('');
        setCurrentView('page');
        setSidebarOpen(false);
      }
    } catch {}
  };

  const handlePageClick = (pageIndex: number) => {
    const page = pages[pageIndex];
    if (page) {
      setCurrentPageIndex(pageIndex);
      setCurrentPageContent(page.content || '');
      setLastSavedContent(page.content || '');
      setCurrentView('page');
      setSidebarOpen(false);
    }
  };

  const handleBackToContents = async () => {
    if (currentPageIndex !== null && pages[currentPageIndex]) {
      const page = pages[currentPageIndex];
      if (currentPageContent !== lastSavedContent) {
        try {
          const pageTitle = extractH1Title(currentPageContent);
          await savePageMutation.mutateAsync({ pageId: page.id, title: pageTitle, content: currentPageContent });
          setLastSavedContent(currentPageContent);
        } catch {}
      }
    }
    navigateToTOC();
  };

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) return;
    try { await deletePageMutation.mutateAsync(pageId); } catch {}
  };

  const saveAndNavigate = async (targetIndex: number) => {
    if (currentPageIndex !== null && pages[currentPageIndex]) {
      const page = pages[currentPageIndex];
      if (currentPageContent !== lastSavedContent) {
        try {
          const pageTitle = extractH1Title(currentPageContent);
          await savePageMutation.mutateAsync({ pageId: page.id, title: pageTitle, content: currentPageContent });
          setLastSavedContent(currentPageContent);
        } catch {}
      }
    }
    const targetPage = pages[targetIndex];
    if (targetPage) {
      setCurrentPageIndex(targetIndex);
      setCurrentPageContent(targetPage.content || '');
      setLastSavedContent(targetPage.content || '');
    }
  };

  const handleNextPage = async () => {
    if (currentView === 'toc') {
      if (pages.length > 0) handlePageClick(0);
    } else if (currentPageIndex !== null && currentPageIndex < pages.length - 1) {
      saveAndNavigate(currentPageIndex + 1);
    }
  };

  const handlePrevPage = async () => {
    if (currentView === 'page' && currentPageIndex === 0) {
      await handleBackToContents();
    } else if (currentPageIndex !== null && currentPageIndex > 0) {
      saveAndNavigate(currentPageIndex - 1);
    }
  };

  const handleAutoPageBreak = useCallback(async (overflowHTML: string, trimmedHTML: string) => {
    if (!noteId) return;
    setCurrentPageContent(trimmedHTML);
    const currentTitle = extractH1Title(trimmedHTML);
    if (currentPageIndex !== null && pages[currentPageIndex]) {
      const page = pages[currentPageIndex];
      try {
        await savePageMutation.mutateAsync({ pageId: page.id, title: currentTitle, content: trimmedHTML });
        setLastSavedContent(trimmedHTML);
      } catch {}
    }
    try {
      const pageId = await createPageMutation.mutateAsync({ noteId });
      if (pageId) {
        let overflowTitle = extractH1Title(overflowHTML);
        let finalOverflowHTML = overflowHTML;
        if (overflowTitle === 'Untitled Page' && currentTitle !== 'Untitled Page') {
          overflowTitle = getNextContinuationTitle(currentTitle);
          finalOverflowHTML = `<h1>${overflowTitle}</h1>${overflowHTML}`;
        }
        await savePageMutation.mutateAsync({ pageId, title: overflowTitle, content: finalOverflowHTML });
        const updatedPages = (await refetchPages()).data || [];
        setCurrentPageIndex(updatedPages.length - 1);
        setCurrentPageContent(finalOverflowHTML);
        setLastSavedContent(finalOverflowHTML);
      }
    } catch {}
  }, [noteId, currentPageIndex, pages, savePageMutation, createPageMutation, refetchPages, setCurrentPageContent, setLastSavedContent, setCurrentPageIndex]);

  useAutoPageBreak({ editor, enabled: currentView === 'page' && !isSmallScreen, onOverflow: handleAutoPageBreak });

  useEffect(() => {
    if (currentView !== 'page' || currentPageIndex === null || !pages[currentPageIndex]) return;
    if (currentPageContent === lastSavedContent) return;
    setSaveStatus('saving');
    const timeoutId = setTimeout(async () => {
      try {
        const page = pages[currentPageIndex];
        const pageTitle = extractH1Title(currentPageContent);
        await savePageMutation.mutateAsync({ pageId: page.id, title: pageTitle, content: currentPageContent });
        setLastSavedContent(currentPageContent);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [currentPageContent, currentPageIndex, pages, lastSavedContent, currentView, setSaveStatus, setLastSavedContent, savePageMutation]);

  useEffect(() => {
    if (!noteId || !title.trim() || currentView === 'cover') return;
    const timeoutId = setTimeout(async () => {
      try {
        const newSlug = await saveNoteMutation.mutateAsync({ id: noteId, title, content: '', tags, coverColor });
        if (newSlug && newSlug !== slug) {
          setSlug(newSlug);
          router.replace(`/editor/${newSlug}`, { scroll: false });
        }
      } catch {}
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [noteId, title, tags, coverColor, slug, router, currentView, setSlug, saveNoteMutation]);

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

  const sidebarProps = {
    noteId: resolvedNoteId,
    title,
    onTitleChange: setTitle,
    pages,
    currentPageIndex,
    onPageClick: handlePageClick,
    onAddPage: handleAddPage,
    tags,
    onRemoveTag: removeTag,
    showTagInput,
    tagInput,
    onTagInputChange: setTagInput,
    onTagInputKeyDown: handleTagKeyDown,
    onTagInputBlur: () => { if (tagInput.trim()) handleAddTag(); setTimeout(() => setShowTagInput(false), 150); },
    onAddTagClick: () => setShowTagInput(true),
    saveStatusIndicator: (
      <div className="flex items-center gap-2 select-none h-6">
        <AnimatePresence mode="wait">
          {saveStatus === 'saving' ? (
            <motion.div key="saving" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="px-3 py-1 rounded-full bg-primary/5 border border-primary/10 flex items-center gap-2">
              <Loading03Icon className="w-3 h-3 text-primary animate-spin" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Saving</span>
            </motion.div>
          ) : saveStatus === 'saved' ? (
            <motion.div key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-3 py-1 rounded-full bg-green-500/5 border border-green-500/10 flex items-center gap-2">
              <Tick01Icon className="w-3 h-3 text-green-600" />
              <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">Synced</span>
            </motion.div>
          ) : saveStatus === 'error' ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-1 rounded-full bg-red-500/5 border border-red-500/10 flex items-center gap-2">
              <AlertCircleIcon className="w-3 h-3 text-red-600" />
              <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Offline</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    ),
    onBack: handleBack,
  };

  const aiButtons = [
    { id: 'continue_writing', label: 'CONTINUE', icon: PencilEdit02Icon, title: 'AI continues writing from cursor' },
    { id: 'generate_outline', label: 'OUTLINE', icon: NoteIcon, title: 'Generate heading structure' },
    { id: 'summarize_page', label: 'SUMMARY', icon: SummationCircleIcon, title: 'Summarize the entire page' },
    { id: 'generate_flashcards', label: 'FLASHCARDS', icon: FlashIcon, title: 'Generate flashcards' },
  ] as const;

  const aiToolbarSlot = (
    <div className="flex items-center gap-1.5 ml-1">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/40 pr-3 border-r border-border/10 mr-1 shrink-0">
        <GoogleGeminiIcon className="w-3.5 h-3.5" />
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-background-muted/40 border border-border/10 text-foreground-muted/60 hover:text-blue-600 hover:bg-blue-500/5 transition-all disabled:opacity-30 whitespace-nowrap uppercase tracking-wider"
          >
            {isLoading ? <Loading03Icon className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{action.label}</span>
          </button>
        );
      })}
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

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-background selection:bg-primary/20">
      {!isSmallScreen && <EditorSidebar {...sidebarProps} className="w-72 shrink-0 shadow-lg relative z-[60]" />}

      <AnimatePresence>
        {isSmallScreen && sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-80 max-w-[85%] z-[110]">
              <EditorSidebar {...sidebarProps} onBack={() => setSidebarOpen(false)} className="border-r-0 shadow-2xl" isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-14 shrink-0 border-b border-border/40 bg-surface/90 backdrop-blur-xl flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-4 min-w-0">
            {isSmallScreen && (
              <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-background-muted/40 border border-border/10 text-foreground-muted">
                <Menu01Icon className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col min-w-0">
              <h1 className="text-[13px] font-black truncate text-foreground leading-tight tracking-tight uppercase">
                {currentView === 'page' && currentPageIndex !== null ? pages[currentPageIndex]?.title || 'Untitled Page' : currentView === 'toc' ? 'Index' : 'Cover'}
              </h1>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/50 truncate">
                {title || 'Untitled Notebook'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {!isSmallScreen && (
              <div className="flex items-center gap-1 bg-background-muted/30 p-1 rounded-2xl border border-border/10">
                <button onClick={handlePrevPage} disabled={currentView === 'toc' || (currentView === 'page' && currentPageIndex === 0)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface text-foreground-muted disabled:opacity-10 transition-all">
                  <ArrowLeft01Icon className="w-4 h-4" />
                </button>
                <button onClick={handleNextPage} disabled={currentView === 'page' && currentPageIndex === pages.length - 1} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface text-foreground-muted disabled:opacity-10 transition-all">
                  <ArrowRight01Icon className="w-4 h-4" />
                </button>
              </div>
            )}
            {!isSmallScreen && sidebarProps.saveStatusIndicator}
          </div>
        </header>

        {currentView === 'page' && editor && (
          <div className="shrink-0 border-b border-border/40 bg-surface/40 backdrop-blur-sm">
             <EditorToolbar editor={editor} fullscreen trailingSlot={aiToolbarSlot} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide relative bg-background-muted/5">
          <AnimatePresence mode="wait">
            {currentView === 'cover' ? (
              <motion.div key="cover" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="min-h-full flex items-center justify-center p-12">
                <div className="w-full max-w-md aspect-[3/4.2] shadow-2xl rounded-[2.5rem] overflow-hidden border border-border/10">
                  <ClayNotebookCover mode="editor" title={title} onTitleChange={setTitle} onOpen={handleOpenNotebook} onColorChange={setCoverColor} color={coverColor} theme={theme} />
                </div>
              </motion.div>
            ) : currentView === 'toc' ? (
              <motion.div key={isSmallScreen ? 'toc-mob' : 'toc-dt'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full max-w-4xl mx-auto w-full p-6 sm:p-12">
                 {isSmallScreen ? (
                   <div className="space-y-6">
                      <div className="flex flex-col gap-1 px-4">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">CONTENTS</span>
                        <h2 className="text-2xl font-black tracking-tight">{title}</h2>
                      </div>
                      <div className="space-y-2">
                        {pages.map((p, i) => (
                          <button key={p.id} onClick={() => handlePageClick(i)} className="w-full flex items-center gap-4 p-5 rounded-3xl bg-surface border border-border/20 shadow-sm active:scale-[0.98] transition-all text-left">
                            <span className="w-9 h-9 flex items-center justify-center rounded-2xl bg-primary/5 text-primary text-[11px] font-black shrink-0">{i + 1}</span>
                            <span className="flex-1 text-sm font-bold truncate">{p.title || 'Untitled Page'}</span>
                            <ArrowRight01Icon className="w-4 h-4 opacity-20" />
                          </button>
                        ))}
                      </div>
                      <button onClick={handleAddPage} className="w-full py-5 border-2 border-dashed border-border/20 rounded-[2rem] flex items-center justify-center gap-2 text-primary/60 font-black text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all">
                        <Add01Icon className="w-4 h-4" /> New Page
                      </button>
                   </div>
                 ) : (
                  <TableOfContents notebookTitle={title} pages={pages} onPageClick={handlePageClick} onAddPage={handleAddPage} onDeletePage={handleDeletePage} theme={theme} isLoading={isLoadingPages} />
                 )}
              </motion.div>
            ) : (
              <motion.div key={`page-${currentPageIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full flex flex-col items-center">
                <div className="w-full sm:max-w-4xl flex-1 flex flex-col relative bg-surface shadow-2xl sm:my-8 sm:rounded-[2.5rem] border-x sm:border border-border/40 overflow-hidden ring-1 ring-black/[0.02]">
                   {currentPageIndex !== null && pages[currentPageIndex] ? (
                    <NotebookPage content={currentPageContent} onChange={setCurrentPageContent} theme={theme} onEditorReady={handleEditorReady} simpleMode={true} />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20">
                       <BookOpen01Icon className="w-12 h-12 mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select a page to begin</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* REFACTORED: Mobile Bottom Navigation as a permanent sticky footer */}
        {isSmallScreen && currentView === 'page' && (
           <div className="shrink-0 bg-surface/90 backdrop-blur-xl border-t border-border/40 px-6 py-4 pb-8 flex items-center justify-between z-[80]">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPageIndex === 0}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-background-muted/40 border border-border/10 text-foreground-muted disabled:opacity-10 transition-all active:scale-95"
                >
                  <ArrowLeft01Icon className="w-6 h-6" />
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Page</span>
                  <span className="text-sm font-black text-foreground">{(currentPageIndex ?? 0) + 1} / {pages.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/5 border border-primary/20 text-primary transition-all active:scale-95"
                >
                  <Add01Icon className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPageIndex === pages.length - 1}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 text-white disabled:opacity-20 transition-all active:scale-95"
                >
                  <ArrowRight01Icon className="w-6 h-6" />
                </button>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}

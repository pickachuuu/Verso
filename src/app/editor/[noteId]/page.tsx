'use client';

import { useEffect, useCallback, ReactNode, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

// UI Components
import { VerticalEditorToolbar, Editor } from '@/component/ui/RichTextEditor';
import { TIPTAP_FORMATTING_GUIDE } from '@/component/ui/AISelectionBubble';
import PageFlipContainer, { ViewType } from '@/component/ui/PageFlipContainer';
import ClayNotebookCover, { NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import TableOfContents, { NotePage } from '@/component/ui/TableOfContents';
import NotebookPage from '@/component/ui/NotebookPage';

// Hooks
import { useNotebookScale, NOTEBOOK_WIDTH, NOTEBOOK_HEIGHT } from '@/hooks/useNotebookScale';

// Icons
import {
  ArrowLeft02Icon,
  Tick01Icon,
  Loading03Icon,
  AlertCircleIcon,
  Home01Icon,
  Cancel01Icon,
  Tag01Icon,
  Menu01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ArrowUpRight01Icon,
  ArrowDownLeft01Icon,
  Add01Icon,
} from 'hugeicons-react';
import { NotebookIcon } from '@/component/icons';

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
  noteKeys,
} from '@/hooks/useNotes';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteIdOrSlug = params?.noteId as string | undefined;
  const isNewNote = !noteIdOrSlug || noteIdOrSlug === 'new';

  // Previous content ref for flip animation
  const previousContentRef = useRef<ReactNode>(null);

  // Track if we've initialized this session
  const initializedRef = useRef<string | null>(null);

  // Notebook scaling – keeps a fixed number of grid lines on every screen size
  const notebookContainerRef = useRef<HTMLDivElement>(null);
  const scale = useNotebookScale(notebookContainerRef);

  // ========================================
  // Zustand Stores
  // ========================================
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
    setPreviousContent,
    navigateToPage,
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
    setTags,
    addTag,
    removeTag,
    setCoverColor,
    setNoteData,
    reset: resetNote,
  } = useNoteStore();

  const {
    saveStatus,
    isLoading,
    showTagInput,
    tagInput,
    setSaveStatus,
    setIsLoading,
    setShowTagInput,
    setTagInput,
    reset: resetUI,
  } = useUIStore();

  // Notebook paper stays light; surrounding UI uses dark styling
  const theme = 'light' as const;
  const toolbarTheme = 'dark' as const;

  // ========================================
  // Reset stores when creating a new notebook
  // ========================================
  useEffect(() => {
    // Only reset if we're on a new note AND we haven't initialized for this route yet
    // This prevents resetting when navigating back to an existing note
    const currentRoute = isNewNote ? 'new' : noteIdOrSlug;

    if (initializedRef.current !== currentRoute) {
      if (isNewNote) {
        // Reset all stores for a fresh new note
        resetEditor();
        resetNote();
        resetUI();
      }
      initializedRef.current = currentRoute || null;
    }
    // Only depend on route identifiers, not on reset functions (they're stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewNote, noteIdOrSlug]);

  // ========================================
  // TanStack Query Hooks
  // ========================================
  const queryClient = useQueryClient();
  const { data: fetchedNote, isLoading: isLoadingNote } = useNote(noteIdOrSlug);

  // Use fetchedNote?.id directly so pages start fetching in the same render cycle
  // as the note data arrives, instead of waiting for Zustand store to update
  const resolvedNoteId = fetchedNote?.id ?? noteId;
  const { data: pages = [], isLoading: isLoadingPages, refetch: refetchPages } = useNotePages(resolvedNoteId);

  const createNoteMutation = useCreateNote();
  const saveNoteMutation = useSaveNote();
  const createPageMutation = useCreatePage();
  const savePageMutation = useSavePage();
  const deletePageMutation = useDeletePage();

  // ========================================
  // Load note data when fetched
  // ========================================
  useEffect(() => {
    if (fetchedNote) {
      setNoteData({
        id: fetchedNote.id,
        slug: fetchedNote.slug,
        title: fetchedNote.title || '',
        tags: fetchedNote.tags || [],
        coverColor: (fetchedNote.cover_color as NotebookColorKey) || 'royal',
      });

      // Go directly to TOC for existing notes
      setCurrentView('toc');

      // Update URL if needed
      if (fetchedNote.slug && noteIdOrSlug === fetchedNote.id) {
        router.replace(`/editor/${fetchedNote.slug}`, { scroll: false });
      }
    }
  }, [fetchedNote, noteIdOrSlug, router, setNoteData, setCurrentView]);

  // ========================================
  // Handle page content migration (if note has content but no pages)
  // ========================================
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
  }, [noteId, pages.length, fetchedNote?.content]);

  // ========================================
  // Capture current state for flip animation
  // ========================================
  const captureCurrentState = useCallback(() => {
    if (currentView === 'cover') {
      previousContentRef.current = (
        <ClayNotebookCover
          mode="editor"
          title={title}
          onTitleChange={() => {}}
          onOpen={() => {}}
          color={coverColor}
          theme={theme}
        />
      );
    } else if (currentView === 'toc') {
      previousContentRef.current = (
        <TableOfContents
          notebookTitle={title}
          pages={pages}
          onPageClick={() => {}}
          onAddPage={() => {}}
          onDeletePage={() => {}}
          theme={theme}
        />
      );
    } else if (currentView === 'page' && currentPageIndex !== null) {
      previousContentRef.current = (
        <NotebookPage
          content={currentPageContent}
          onChange={() => {}}
          theme={theme}
        />
      );
    }
  }, [currentView, title, coverColor, theme, pages, currentPageIndex, currentPageContent]);

  // ========================================
  // Editor callback
  // ========================================
  const handleEditorReady = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
  }, [setEditor]);

  // ========================================
  // AI Sidebar Actions
  // ========================================
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const callAI = useCallback(async (systemPrompt: string, userContent: string): Promise<string> => {
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
          }),
        }
      );
      if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    const perplexityKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    if (!perplexityKey) throw new Error('No API key configured');
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${perplexityKey}` },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 2048,
      }),
    });
    if (!res.ok) throw new Error(`Perplexity error: ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }, []);

  const handleAIAction = useCallback(async (action: string) => {
    if (!editor || aiLoading) return;

    const pageContent = editor.getHTML();
    const textContent = editor.getText();
    setAiLoading(action);

    try {
      let result = '';

      const cleanAIResult = (raw: string) =>
        raw.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

      switch (action) {
        case 'continue_writing': {
          result = await callAI(
            `You are a helpful writing assistant. Continue writing from where the user left off. Match the tone, style, and topic of the existing content. Write 2-3 paragraphs of continuation.\n\n${TIPTAP_FORMATTING_GUIDE}`,
            textContent || 'This is an empty page. Write an engaging opening paragraph on a general study topic.'
          );
          editor.chain().focus('end').insertContent(cleanAIResult(result)).run();
          break;
        }
        case 'generate_outline': {
          result = await callAI(
            `You are a study assistant. Based on the following content, generate a structured outline. Use <h2> for main sections and <h3> for subsections. Include brief placeholder text under each heading to guide the student.\n\n${TIPTAP_FORMATTING_GUIDE}`,
            textContent || 'Generate a general study outline for a student notebook page.'
          );
          editor.chain().focus('end').insertContent(cleanAIResult(result)).run();
          break;
        }
        case 'summarize_page': {
          result = await callAI(
            `You are a study assistant. Summarize the following note content into a concise, well-structured summary. Use bullet points for key ideas, highlight important terms, and use headings to organize.\n\n${TIPTAP_FORMATTING_GUIDE}`,
            textContent
          );
          editor.chain().focus('end').insertContent(`<hr>${cleanAIResult(result)}`).run();
          break;
        }
        case 'generate_flashcards': {
          alert('To generate flashcards, select specific text in the editor or use the Flashcards page with this note.');
          break;
        }
      }
    } catch (err) {
      console.error('AI sidebar action error:', err);
    } finally {
      setAiLoading(null);
    }
  }, [editor, aiLoading, callAI]);

  // ========================================
  // Note Actions
  // ========================================
  const handleOpenNotebook = async () => {
    if (!title.trim()) return;
    captureCurrentState();

    if (!noteId && isNewNote) {
      try {
        // createNote now inserts with title + slug atomically — no orphan risk
        const { id: newId, slug: newSlug } = await createNoteMutation.mutateAsync({ title, coverColor });
        setId(newId);
        setSaveStatus('saved');

        // Trigger the flip animation FIRST - this must happen before any
        // router navigation which could re-mount the component and reset animation state
        setCurrentView('toc');

        // Then seed the query cache and defer the URL change to after the
        // flip animation completes (500ms), preventing both the spinner flash
        // and animation interference
        setSlug(newSlug);
        queryClient.setQueryData(noteKeys.detail(newSlug), {
          id: newId,
          title,
          content: '',
          tags: [] as string[],
          cover_color: coverColor,
          slug: newSlug,
          user_id: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setTimeout(() => {
          router.replace(`/editor/${newSlug}`, { scroll: false });
        }, 600);
      } catch (error) {
        setSaveStatus('error');
        return;
      }
    } else {
      setCurrentView('toc');
    }
  };

  const handleAddPage = async () => {
    if (!noteId) return;
    captureCurrentState();

    try {
      const pageId = await createPageMutation.mutateAsync({ noteId });
      if (pageId) {
        // Single refetch to get updated page list (mutation already invalidated the cache)
        const updatedPages = (await refetchPages()).data || [];
        const newPageIndex = updatedPages.length - 1;
        setCurrentPageIndex(newPageIndex);
        setCurrentPageContent('');
        setLastSavedContent('');
        setCurrentView('page');
      }
    } catch (error) {
      console.error('Error creating page:', error);
    }
  };

  const handlePageClick = (pageIndex: number) => {
    const page = pages[pageIndex];
    if (page) {
      captureCurrentState();
      setCurrentPageIndex(pageIndex);
      setCurrentPageContent(page.content || '');
      setLastSavedContent(page.content || '');
      setCurrentView('page');
    }
  };

  const handleBackToContents = async () => {
    captureCurrentState();

    // Save current page content before going back
    if (currentPageIndex !== null && pages[currentPageIndex]) {
      const page = pages[currentPageIndex];
      if (currentPageContent !== lastSavedContent) {
        try {
          const pageTitle = extractH1Title(currentPageContent);
          await savePageMutation.mutateAsync({ pageId: page.id, title: pageTitle, content: currentPageContent });
          setLastSavedContent(currentPageContent);

          // Optimistically update the cached pages so TOC shows fresh titles instantly
          queryClient.setQueryData(noteKeys.pages(noteId!), (oldPages: NotePage[] | undefined) => {
            if (!oldPages) return oldPages;
            return oldPages.map((p, i) =>
              i === currentPageIndex
                ? { ...p, title: pageTitle, content: currentPageContent }
                : p
            );
          });
        } catch (error) {
          console.error('Error saving page:', error);
        }
      }
    }

    // Navigate immediately - no need to await a refetch, cache is already up to date
    navigateToTOC();
  };

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) return;

    try {
      await deletePageMutation.mutateAsync(pageId);
      // No manual refetch needed - useDeletePage already invalidates the pages cache
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  // ========================================
  // Page Navigation
  // ========================================
  const saveAndNavigate = async (targetIndex: number) => {
    captureCurrentState();

    if (currentPageIndex !== null && pages[currentPageIndex]) {
      const page = pages[currentPageIndex];
      if (currentPageContent !== lastSavedContent) {
        try {
          const pageTitle = extractH1Title(currentPageContent);
          await savePageMutation.mutateAsync({ pageId: page.id, title: pageTitle, content: currentPageContent });
          setLastSavedContent(currentPageContent);
        } catch (error) {
          console.error('Error saving page:', error);
        }
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

  const handleFirstPage = async () => {
    if (currentView === 'page') {
      await handleBackToContents();
    }
  };

  const handleLastPage = () => {
    if (currentView === 'toc' && pages.length > 0) {
      handlePageClick(pages.length - 1);
    } else if (currentPageIndex !== null && currentPageIndex !== pages.length - 1) {
      saveAndNavigate(pages.length - 1);
    }
  };

  const handleAddPageFromEditor = async () => {
    if (!noteId) return;

    // Save current page first
    if (currentPageIndex !== null && pages[currentPageIndex]) {
      const page = pages[currentPageIndex];
      if (currentPageContent !== lastSavedContent) {
        try {
          const pageTitle = extractH1Title(currentPageContent);
          await savePageMutation.mutateAsync({ pageId: page.id, title: pageTitle, content: currentPageContent });
        } catch (error) {
          console.error('Error saving page:', error);
        }
      }
    }

    try {
      const pageId = await createPageMutation.mutateAsync({ noteId });
      if (pageId) {
        const updatedPages = (await refetchPages()).data || [];
        const newPageIndex = updatedPages.length - 1;
        setCurrentPageIndex(newPageIndex);
        setCurrentPageContent('');
        setLastSavedContent('');
      }
    } catch (error) {
      console.error('Error creating page:', error);
    }
  };

  // ========================================
  // Auto-save page content
  // ========================================
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

        // Optimistically update cached pages so TOC titles stay in sync without a network roundtrip
        if (noteId) {
          queryClient.setQueryData(noteKeys.pages(noteId), (oldPages: NotePage[] | undefined) => {
            if (!oldPages) return oldPages;
            return oldPages.map((p, i) =>
              i === currentPageIndex
                ? { ...p, title: pageTitle, content: currentPageContent }
                : p
            );
          });
        }
      } catch {
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [currentPageContent, currentPageIndex, pages, lastSavedContent, currentView, setSaveStatus, setLastSavedContent, noteId, queryClient]);

  // ========================================
  // Auto-save note metadata
  // ========================================
  useEffect(() => {
    if (!noteId || !title.trim() || currentView === 'cover') return;

    const timeoutId = setTimeout(async () => {
      try {
        const newSlug = await saveNoteMutation.mutateAsync({ id: noteId, title, content: '', tags, coverColor });
        if (newSlug && newSlug !== slug) {
          setSlug(newSlug);

          // Seed the query cache before changing the URL so useNote(slug) has
          // data immediately and doesn't flash the loading spinner
          queryClient.setQueryData(noteKeys.detail(newSlug), {
            id: noteId,
            title,
            content: '',
            tags,
            cover_color: coverColor,
            slug: newSlug,
            user_id: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          router.replace(`/editor/${newSlug}`, { scroll: false });
        }
      } catch {
        // Silent fail for metadata save
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [noteId, title, tags, coverColor, slug, router, currentView, setSlug, queryClient]);

  // ========================================
  // Tag Handlers
  // ========================================
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

  // ========================================
  // Loading State
  // Keep the spinner until both note AND pages are loaded to prevent
  // the TOC from flashing an empty "No pages yet" state on fresh loads
  // ========================================
  if (!isNewNote && (isLoadingNote || (!!resolvedNoteId && isLoadingPages))) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#f9f9f6' }}>
        <div className="flex flex-col items-center gap-4">
          <Loading03Icon className="w-10 h-10 text-primary animate-spin" />
          <p style={{ color: '#4c4c4c' }}>Loading notebook...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // Dark blue theme styles (matching app theme)
  // ========================================
  const bgColor = '#141420';
  const borderColor = 'rgba(255, 255, 255, 0.08)';
  const textColor = '#94A3B8';
  const iconColor = '#94A3B8';

  // ========================================
  // Content Components
  // ========================================
  const coverComponent = (
    <ClayNotebookCover
      mode="editor"
      title={title}
      onTitleChange={setTitle}
      onOpen={handleOpenNotebook}
      onColorChange={setCoverColor}
      color={coverColor}
      theme={theme}
    />
  );

  const tocComponent = (
    <TableOfContents
      notebookTitle={title}
      pages={pages}
      onPageClick={handlePageClick}
      onAddPage={handleAddPage}
      onDeletePage={handleDeletePage}
      theme={theme}
      isLoading={isLoadingPages}
    />
  );

  const pageComponent =
    currentPageIndex !== null && pages[currentPageIndex] ? (
      <NotebookPage
        content={currentPageContent}
        onChange={setCurrentPageContent}
        theme={theme}
        onEditorReady={handleEditorReady}
      />
    ) : null;

  const getPreviousContentComponent = (): ReactNode => previousContentRef.current;
  const showHeader = currentView !== 'cover';

  // ========================================
  // Render
  // ========================================
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* Header — seamless dark bar */}
      {showHeader && (
        <header
          className="flex-shrink-0 relative z-30"
          style={{
            background: 'linear-gradient(180deg, rgba(20, 20, 32, 0.95) 0%, rgba(18, 17, 30, 0.9) 100%)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="flex items-center gap-3 px-5 h-12">
            {/* Left: navigation */}
            {currentView === 'page' ? (
              <button
                onClick={handleBackToContents}
                className="h-8 px-2.5 rounded-lg transition-all flex items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                title="Back to Contents"
              >
                <Menu01Icon className="w-4 h-4" style={{ color: '#94A3B8' }} />
                <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>Contents</span>
              </button>
            ) : (
              <Link
                href="/library"
                className="h-8 w-8 rounded-lg transition-all flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                title="Back to Library"
              >
                <ArrowLeft02Icon className="w-4 h-4" style={{ color: '#94A3B8' }} />
              </Link>
            )}

            {/* Separator dot */}
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />

            {/* Notebook icon + title */}
            <NotebookIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#F68048' }} />

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled notebook"
                className="w-full text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-600"
                style={{ color: '#E2E8F0' }}
              />
            </div>

            {/* Page indicator (inline) */}
            {currentView === 'page' && currentPageIndex !== null && (
              <span className="text-xs font-medium flex-shrink-0" style={{ color: '#64748B' }}>
                {currentPageIndex + 1} / {pages.length}
              </span>
            )}

            {/* Tags inline */}
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-shrink-0 overflow-x-auto max-w-[200px]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: 'rgba(40, 69, 214, 0.15)',
                      color: '#5B7BF0',
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded transition-colors hover:bg-white/10"
                    >
                      <Cancel01Icon className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Separator dot */}
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />

            {/* Right actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Save status */}
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1 text-xs px-2" style={{ color: '#64748B' }}>
                  <Loading03Icon className="w-3 h-3 animate-spin" />
                  <span>Saving</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1 text-xs px-2" style={{ color: '#22C55E' }}>
                  <Tick01Icon className="w-3 h-3" />
                  <span>Saved</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1 text-xs px-2 text-red-400">
                  <AlertCircleIcon className="w-3 h-3" />
                  <span>Error</span>
                </div>
              )}

              {/* Tags button */}
              <div className="relative">
                {showTagInput ? (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => {
                      if (tagInput.trim()) handleAddTag();
                      setTimeout(() => setShowTagInput(false), 150);
                    }}
                    placeholder="Add tag..."
                    className="w-24 px-2 py-1 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#F1F5F9',
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTagInput(true)}
                    className="h-8 w-8 rounded-lg transition-all flex items-center justify-center hover:bg-white/8"
                    title="Add tags"
                  >
                    <Tag01Icon className="w-4 h-4" style={{ color: '#64748B' }} />
                  </button>
                )}
              </div>

              <Link
                href="/dashboard"
                className="h-8 w-8 rounded-lg transition-all flex items-center justify-center hover:bg-white/8"
                title="Dashboard"
              >
                <Home01Icon className="w-4 h-4" style={{ color: '#64748B' }} />
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Content Area */}
      <div
        className="flex-1 overflow-hidden flex relative"
        style={{ backgroundColor: '#12111E' }}
      >
        {/* Gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(180, 150, 110, 0.06) 0%, transparent 60%),
                 radial-gradient(ellipse 80% 50% at 20% 80%, rgba(40, 50, 120, 0.04) 0%, transparent 50%),
                 radial-gradient(ellipse 60% 40% at 80% 20%, rgba(30, 30, 80, 0.03) 0%, transparent 50%)`,
          }}
        />

        {/* Main notebook area — ref used by useNotebookScale to measure available space */}
        <div
          ref={notebookContainerRef}
          className="flex-1 overflow-hidden py-8 px-4 relative z-10 flex items-center justify-center"
        >
          {/* Outer wrapper sized to the *scaled* dimensions so surrounding
              layout (right-side panel, centering) flows correctly */}
          <div
            style={{
              width: NOTEBOOK_WIDTH * scale,
              height: NOTEBOOK_HEIGHT * scale,
            }}
          >
            {/* Inner notebook at canonical (fixed) size, then scaled down */}
            <div
              className="relative"
              style={{
                width: NOTEBOOK_WIDTH,
                height: NOTEBOOK_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Page stack effect */}
              {currentView === 'page' && pages.length > 1 && (
                <>
                  {[...Array(Math.min(pages.length - 1, 4))].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-lg"
                      style={{
                        top: `${(i + 1) * 3}px`,
                        right: `${-(i + 1) * 3}px`,
                        bottom: `${-(i + 1) * 3}px`,
                        left: `${(i + 1) * 3}px`,
                        background: `linear-gradient(135deg, ${i % 2 === 0 ? '#1E293B' : '#1A2438'} 0%, ${i % 2 === 0 ? '#172033' : '#151E30'} 100%)`,
                        boxShadow: `0 ${2 + i}px ${4 + i * 2}px rgba(0,0,0,${0.25 - i * 0.03})`,
                        zIndex: -i - 1,
                      }}
                    />
                  ))}
                </>
              )}

              {/* Main notebook */}
              <div className="relative h-full rounded-lg shadow-xl">
                <PageFlipContainer
                  currentView={currentView}
                  currentPageIndex={currentPageIndex}
                  totalPages={pages.length}
                  cover={coverComponent}
                  toc={tocComponent}
                  pageContent={pageComponent}
                  previousContent={getPreviousContentComponent()}
                  theme={theme}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right side control panel — centered in the right gutter, fills space */}
        {(currentView === 'toc' || currentView === 'page') && (
          <div
            className="absolute right-0 top-0 bottom-0 flex items-center justify-center z-20"
            style={{ width: `calc((100% - ${NOTEBOOK_WIDTH * scale}px) / 2)`, minWidth: '220px' }}
          >
            <div
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                width: 'calc(100% - 40px)',
                maxWidth: '230px',
                maxHeight: 'calc(100vh - 140px)',
                background: 'linear-gradient(160deg, rgba(28, 28, 42, 0.88) 0%, rgba(22, 21, 35, 0.92) 100%)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {/* Page indicator + nav */}
              <div
                className="p-3 flex items-center justify-between flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentView === 'toc'}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white"
                    style={{
                      backgroundColor: currentView === 'toc' ? 'transparent' : 'rgba(255,255,255,0.06)',
                    }}
                    title={currentView === 'page' && currentPageIndex === 0 ? 'Back to Contents' : 'Previous page'}
                  >
                    <ArrowLeft01Icon className="w-4 h-4" />
                  </button>

                  <span className="text-sm font-medium select-none" style={{ color: '#94A3B8' }}>
                    {currentView === 'toc' ? (
                      'Contents'
                    ) : (
                      <><span style={{ color: '#E2E8F0', fontWeight: 700 }}>{(currentPageIndex ?? 0) + 1}</span> / {pages.length}</>
                    )}
                  </span>

                  <button
                    onClick={handleNextPage}
                    disabled={currentView === 'page' && currentPageIndex === pages.length - 1}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white"
                    style={{
                      backgroundColor: (currentView === 'page' && currentPageIndex === pages.length - 1) ? 'transparent' : 'rgba(255,255,255,0.06)',
                    }}
                    title={currentView === 'toc' ? 'Go to first page' : 'Next page'}
                  >
                    <ArrowRight01Icon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleFirstPage}
                    disabled={currentView === 'toc'}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed text-slate-500 hover:text-white"
                    title="Back to Contents"
                  >
                    <ArrowDownLeft01Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleLastPage}
                    disabled={currentView === 'page' && currentPageIndex === pages.length - 1}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed text-slate-500 hover:text-white"
                    title="Last page"
                  >
                    <ArrowUpRight01Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editor toolbar - scrollable, takes all remaining vertical space */}
              {(currentView === 'page' || currentView === 'toc') && (
                <div
                  className="p-3 overflow-y-auto flex-1 min-h-0"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <VerticalEditorToolbar editor={editor} theme={toolbarTheme} onAIAction={handleAIAction} aiLoading={aiLoading} />
                </div>
              )}

              {/* Add new page */}
              <div className="p-3 flex-shrink-0">
                <button
                  onClick={handleAddPageFromEditor}
                  className="w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-medium bg-primary/90 hover:bg-primary text-white"
                  style={{
                    boxShadow: '0 2px 8px rgba(40, 69, 214, 0.3)',
                  }}
                  title="Add new page"
                >
                  <Add01Icon className="w-4 h-4" />
                  <span>Add Page</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

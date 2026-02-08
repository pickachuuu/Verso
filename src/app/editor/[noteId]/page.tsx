'use client';

import { useEffect, useCallback, ReactNode, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

// UI Components
import { VerticalEditorToolbar, Editor } from '@/component/ui/RichTextEditor';
import { TIPTAP_FORMATTING_GUIDE } from '@/component/ui/AISelectionBubble';
import PageFlipContainer from '@/component/ui/PageFlipContainer';
import ClayNotebookCover, { NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import TableOfContents, { NotePage } from '@/component/ui/TableOfContents';
import NotebookPage from '@/component/ui/NotebookPage';
import { ClayCard } from '@/component/ui/Clay';

// Hooks
import { useNotebookScale, NOTEBOOK_WIDTH, NOTEBOOK_HEIGHT } from '@/hooks/useNotebookScale';
import { useAutoPageBreak } from '@/hooks/useAutoPageBreak';

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

  // Notebook paper stays light; surrounding UI uses paper styling
  const theme = 'light' as const;
  const toolbarTheme = 'light' as const;

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
  // Auto page-break (overflow → new page)
  // ========================================
  const handleAutoPageBreak = useCallback(async (overflowHTML: string, trimmedHTML: string) => {
    if (!noteId) return;

    // 1. Update the current page to only the fitting content
    setCurrentPageContent(trimmedHTML);

    if (currentPageIndex !== null && pages[currentPageIndex]) {
      const page = pages[currentPageIndex];
      const pageTitle = extractH1Title(trimmedHTML);
      try {
        await savePageMutation.mutateAsync({ pageId: page.id, title: pageTitle, content: trimmedHTML });
        setLastSavedContent(trimmedHTML);
      } catch (error) {
        console.error('Auto page-break: error saving trimmed page', error);
      }
    }

    // 2. Create a new page and save the overflow content to it
    try {
      const pageId = await createPageMutation.mutateAsync({ noteId });
      if (pageId) {
        const overflowTitle = extractH1Title(overflowHTML);
        await savePageMutation.mutateAsync({ pageId, title: overflowTitle, content: overflowHTML });
        const updatedPages = (await refetchPages()).data || [];
        const newPageIndex = updatedPages.length - 1;

        // 3. Navigate to the new page
        setCurrentPageIndex(newPageIndex);
        setCurrentPageContent(overflowHTML);
        setLastSavedContent(overflowHTML);
      }
    } catch (error) {
      console.error('Auto page-break: error creating overflow page', error);
    }
  }, [noteId, currentPageIndex, pages, savePageMutation, createPageMutation, refetchPages, setCurrentPageContent, setLastSavedContent, setCurrentPageIndex]);

  useAutoPageBreak({
    editor,
    enabled: currentView === 'page',
    onOverflow: handleAutoPageBreak,
  });

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
  const showControls = currentView !== 'cover';
  const pagesPanel = (
    <ClayCard variant="default" padding="lg" className="rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">Pages</span>
        <span className="text-sm font-semibold text-foreground-muted">{pages.length}</span>
      </div>

      {pages.length === 0 ? (
        <div className="mt-4 text-sm text-foreground-muted">
          No pages yet. Add a new page to start writing.
        </div>
      ) : (
        <div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {pages.map((page, index) => {
            const isActive = currentView === 'page' && currentPageIndex === index;
            return (
              <button
                key={page.id}
                onClick={() => handlePageClick(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${
                  isActive
                    ? 'bg-background-muted border-pencil/40 text-foreground'
                    : 'bg-surface border-border text-foreground-muted hover:text-foreground hover:bg-background-muted'
                }`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-semibold bg-background-muted border border-border text-foreground-muted">
                  {index + 1}
                </span>
                <span className="text-base font-semibold truncate">
                  {page.title || 'Untitled Page'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={handleAddPageFromEditor}
        className="mt-4 w-full px-4 py-2.5 rounded-2xl text-sm font-semibold border border-border bg-surface text-foreground hover:bg-background-muted transition-all flex items-center justify-center gap-2"
      >
        <Add01Icon className="w-4 h-4" />
        Add page
      </button>
    </ClayCard>
  );
  const notebookCard = (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-background-muted border border-border">
            <NotebookIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">Notebook</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled notebook"
              className="w-full mt-1 text-lg font-semibold bg-transparent border-none focus:outline-none placeholder:text-foreground-muted text-foreground"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            <Tag01Icon className="w-4 h-4" />
            Tags
          </div>
          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-background-muted border border-border text-foreground-muted"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded transition-colors hover:text-foreground"
                  >
                    <Cancel01Icon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-foreground-muted">
              Add tags to keep your notebook organized.
            </p>
          )}
          <div className="mt-2">
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
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-foreground-muted"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border border-border bg-surface text-foreground-muted hover:text-foreground hover:bg-background-muted transition-all"
              >
                <Tag01Icon className="w-4 h-4" />
                Add tag
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-foreground-muted">
              <Loading03Icon className="w-3.5 h-3.5 animate-spin" />
              Saving
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <Tick01Icon className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1.5 text-red-500">
              <AlertCircleIcon className="w-3.5 h-3.5" />
              Error
            </span>
          )}
        </div>
    </ClayCard>
  );
  const navCard = (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
        <div className="flex items-center justify-between">
          {currentView === 'page' ? (
            <button
              onClick={handleBackToContents}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border border-border bg-surface hover:bg-background-muted transition-all"
            >
              <Menu01Icon className="w-4 h-4 text-foreground-muted" />
              Contents
            </button>
          ) : (
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border border-border bg-surface hover:bg-background-muted transition-all"
            >
              <ArrowLeft02Icon className="w-4 h-4 text-foreground-muted" />
              Library
            </Link>
          )}

          <Link
            href="/dashboard"
            className="h-10 w-10 rounded-2xl border border-border bg-surface hover:bg-background-muted transition-all flex items-center justify-center"
            title="Dashboard"
          >
            <Home01Icon className="w-4 h-4 text-foreground-muted" />
          </Link>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            <Menu01Icon className="w-4 h-4" />
            Navigation
          </div>
          <span className="text-sm font-semibold text-foreground-muted">
            {currentView === 'toc'
              ? `${pages.length} pages`
              : `Page ${(currentPageIndex ?? 0) + 1} / ${pages.length}`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={handlePrevPage}
            disabled={currentView === 'toc'}
            className="px-4 py-2.5 rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground hover:bg-background-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-1.5 justify-center">
              <ArrowLeft01Icon className="w-4 h-4" />
              Prev
            </span>
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentView === 'page' && currentPageIndex === pages.length - 1}
            className="px-4 py-2.5 rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground hover:bg-background-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-1.5 justify-center">
              <ArrowRight01Icon className="w-4 h-4" />
              {currentView === 'toc' ? 'Open First' : 'Next'}
            </span>
          </button>
          <button
            onClick={handleFirstPage}
            disabled={currentView === 'toc'}
            className="px-4 py-2.5 rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground hover:bg-background-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-1.5 justify-center">
              <ArrowDownLeft01Icon className="w-4 h-4" />
              Contents
            </span>
          </button>
          <button
            onClick={handleLastPage}
            disabled={currentView === 'page' && currentPageIndex === pages.length - 1}
            className="px-4 py-2.5 rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground hover:bg-background-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-1.5 justify-center">
              <ArrowUpRight01Icon className="w-4 h-4" />
              Last
            </span>
          </button>
        </div>
    </ClayCard>
  );
  const toolsPanel = (currentView === 'page' || currentView === 'toc') ? (
    <ClayCard variant="default" padding="lg" className="rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">Editor tools</span>
        {aiLoading && (
          <span className="text-xs text-foreground-muted">Running…</span>
        )}
      </div>
      <div className="pr-1">
        <VerticalEditorToolbar editor={editor} theme={toolbarTheme} onAIAction={handleAIAction} aiLoading={aiLoading} />
      </div>
    </ClayCard>
  ) : null;
  const leftRail = (
    <div className="space-y-4">
      {notebookCard}
      {pagesPanel}
    </div>
  );

  const rightRail = (
    <div className="space-y-4">
      {navCard}
      {toolsPanel}
    </div>
  );

  // ========================================
  // Render
  // ========================================
  return (
    <div className="min-h-screen flex flex-col paper-bg text-foreground">
      <div className="flex-1 relative px-3 sm:px-4 lg:px-4 py-5 flex flex-col max-w-none mx-auto w-full">
        <div
          className={`flex-1 grid gap-4 ${showControls ? 'lg:grid-cols-[240px_minmax(0,1fr)_240px] 2xl:grid-cols-[280px_minmax(0,1fr)_280px]' : 'grid-cols-1'}`}
        >
          {showControls && (
            <aside className="space-y-4 lg:sticky lg:top-6 self-start order-2 lg:order-none relative z-[60]">
              {leftRail}
            </aside>
          )}

          <div className="flex flex-col order-1 lg:order-none">
            <div
              ref={notebookContainerRef}
              className="relative w-full flex-1 min-h-[640px] flex items-start justify-center py-6 px-4 sm:px-6"
            >
              <div className="absolute inset-0 rounded-[36px] bg-surface/80 border border-border shadow-[0_20px_60px_rgba(60,50,40,0.16)] pointer-events-none" />

              <div
                className="relative z-10"
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
                  {/* Page stack effect */}
                  {currentView === 'page' && pages.length > 1 && (
                    <>
                      {[...Array(Math.min(pages.length - 1, 4))].map((_, i) => (
                        <div
                          key={i}
                          className="absolute rounded-[18px]"
                          style={{
                            top: `${(i + 1) * 3}px`,
                            right: `${-(i + 1) * 3}px`,
                            bottom: `${-(i + 1) * 3}px`,
                            left: `${(i + 1) * 3}px`,
                            background: `linear-gradient(135deg, rgba(255, 249, 241, 0.98) 0%, rgba(244, 235, 223, 0.98) 100%)`,
                            boxShadow: `0 ${2 + i}px ${6 + i * 2}px rgba(60,50,40,${0.18 - i * 0.02})`,
                            border: '1px solid rgba(60, 50, 40, 0.08)',
                            zIndex: -i - 1,
                          }}
                        />
                      ))}
                    </>
                  )}

                  {/* Main notebook */}
                  <div className="relative h-full rounded-[22px] shadow-[0_18px_48px_rgba(60,50,40,0.2)]">
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
          </div>

          {showControls && (
            <aside className="space-y-4 lg:sticky lg:top-6 self-start order-3 lg:order-none">
              {rightRail}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

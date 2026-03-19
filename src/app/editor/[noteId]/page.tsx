'use client';

import { useEffect, useLayoutEffect, useCallback, ReactNode, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

// UI Components
import { EditorToolbar, Editor } from '@/component/ui/RichTextEditor';
import { TIPTAP_FORMATTING_GUIDE } from '@/component/ui/AISelectionBubble';
import ClayNotebookCover, { NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import TableOfContents, { NotePage } from '@/component/ui/TableOfContents';
import NotebookPage from '@/component/ui/NotebookPage';
import { ClayCard } from '@/component/ui/Clay';
import EditorSidebar from '@/component/ui/EditorSidebar';
import { motion, AnimatePresence } from 'motion/react';

// Hooks
// (AutoPageBreak might still be useful for future enhancements, keeping for now if used internally)
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
  GoogleGeminiIcon,
  PencilEdit02Icon,
  NoteIcon,
  SummationCircleIcon,
  FlashIcon,
  BookOpen01Icon,
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

/**
 * Generates the next title with a Roman numeral suffix.
 * Example: "Programming" -> "Programming II"
 *          "Programming II" -> "Programming III"
 */
function getNextContinuationTitle(currentTitle: string): string {
  // Regex to match a trailing space followed by a Roman numeral (I, V, X)
  const romanMatch = currentTitle.match(/(.*)\s([IVX]+)$/i);

  if (romanMatch) {
    const baseTitle = romanMatch[1];
    const currentRoman = romanMatch[2].toUpperCase();
    const currentNumber = fromRoman(currentRoman);

    // If it's a valid Roman numeral, increment it
    if (currentNumber > 0) {
      return `${baseTitle} ${toRoman(currentNumber + 1)}`;
    }
  }

  // No Roman numeral found, start with II
  return `${currentTitle} II`;
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteIdOrSlug = params?.noteId as string | undefined;
  const isNewNote = !noteIdOrSlug || noteIdOrSlug === 'new';

  // Track if we've initialized this session
  const initializedRef = useRef<string | null>(null);

  // Detect small screens for mobile-responsive layout (sidebar vs drawer)
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)'); // breakpoint for sidebar
    const update = () => setIsSmallScreen(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  // Capture current state for flip animation - REMOVED
  // ========================================

  // ========================================
  // Editor callback
  // ========================================
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

  // ========================================
  // AI Sidebar Actions
  // ========================================
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const callAI = useCallback(async (systemPrompt: string, userContent: string): Promise<string> => {
    const res = await fetch('/api/ai/editor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userContent }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'AI request failed' }));
      throw new Error(err.error || `AI error: ${res.status}`);
    }

    const data = await res.json();
    return data?.text || '';
  }, []);

  const handleAIAction = useCallback(async (action: string) => {
    if (!editor || aiLoading) return;

    const pageContent = editor.getHTML();
    const textContent = editor.getText();
    setAiLoading(action);

    try {
      let result = '';

      const cleanAIResult = (raw: string) => {
        let html = raw
          .replace(/^```html?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();

        // Strip empty paragraphs: <p></p>, <p><br></p>, <p>&nbsp;</p>, <p> </p>
        html = html.replace(/<p>\s*(<br\s*\/?>|\&nbsp;)?\s*<\/p>/gi, '');

        // Strip standalone <br> tags used as spacing between block elements
        html = html.replace(/(<\/(?:p|h[1-6]|ul|ol|li|blockquote|pre|hr|div)>)\s*(?:<br\s*\/?\s*>\s*)+\s*(<(?:p|h[1-6]|ul|ol|li|blockquote|pre|hr|div)[\s>])/gi, '$1$2');

        // Collapse multiple consecutive <hr> into a single one
        html = html.replace(/(<hr\s*\/?\s*>\s*){2,}/gi, '<hr>');

        // Remove leading/trailing <hr>
        html = html.replace(/^\s*<hr\s*\/?\s*>\s*/i, '');
        html = html.replace(/\s*<hr\s*\/?\s*>\s*$/i, '');

        // Collapse multiple newlines/whitespace between tags
        html = html.replace(/>\s{2,}</g, '><');

        return html.trim();
      };

      switch (action) {
        case 'continue_writing': {
          result = await callAI(
            `You are a helpful writing assistant. Continue writing from where the user left off. Match the tone, style, and topic of the existing content. Write 1-2 short, dense paragraphs of continuation. Do NOT add unnecessary spacing or empty lines.\n\n${TIPTAP_FORMATTING_GUIDE}`,
            textContent || 'This is an empty page. Write an engaging opening paragraph on a general study topic.'
          );
          editor.chain().focus('end').insertContent(cleanAIResult(result)).run();
          break;
        }
        case 'generate_outline': {
          result = await callAI(
            `You are a study assistant. Based on the following content, generate a compact structured outline. Use <h2> for main sections only, and a brief bullet list under each. Do NOT include placeholder text or filler — just the outline structure. Keep it tight and concise.\n\n${TIPTAP_FORMATTING_GUIDE}`,
            textContent || 'Generate a general study outline for a student notebook page.'
          );
          editor.chain().focus('end').insertContent(cleanAIResult(result)).run();
          break;
        }
        case 'summarize_page': {
          result = await callAI(
            `You are a study assistant. Summarize the following note content into a brief, tight summary. Use a compact bullet list for key ideas and bold important terms. Avoid excessive headings — use at most one heading. Keep it as short as possible while retaining all key information.\n\n${TIPTAP_FORMATTING_GUIDE}`,
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

    if (!noteId && isNewNote) {
      try {
        const { id: newId, slug: newSlug } = await createNoteMutation.mutateAsync({ title, coverColor });
        setId(newId);
        setSaveStatus('saved');
        setCurrentView('toc');

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
        
        router.replace(`/editor/${newSlug}`, { scroll: false });
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

    try {
      const pageId = await createPageMutation.mutateAsync({ noteId });
      if (pageId) {
        const updatedPages = (await refetchPages()).data || [];
        const newPageIndex = updatedPages.length - 1;
        setCurrentPageIndex(newPageIndex);
        setCurrentPageContent('');
        setLastSavedContent('');
        setCurrentView('page');
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error creating page:', error);
    }
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
    // Save current page content before going back
    if (currentPageIndex !== null && pages[currentPageIndex]) {
      const page = pages[currentPageIndex];
      if (currentPageContent !== lastSavedContent) {
        try {
          const pageTitle = extractH1Title(currentPageContent);
          await savePageMutation.mutateAsync({ pageId: page.id, title: pageTitle, content: currentPageContent });
          setLastSavedContent(currentPageContent);

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

  const onNavigate = (view: 'cover' | 'toc' | 'page', index?: number) => {
    if (view === 'page' && index !== undefined) {
      handlePageClick(index);
    } else if (view === 'toc') {
      navigateToTOC();
    } else if (view === 'cover') {
      setCurrentView('cover');
    }
  };

  const handleContentChange = (content: string) => {
    setCurrentPageContent(content);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
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

    // Get the current page's title for continuation naming
    const currentTitle = extractH1Title(trimmedHTML);

    if (currentPageIndex !== null && pages[currentPageIndex]) {
      const page = pages[currentPageIndex];
      try {
        await savePageMutation.mutateAsync({ pageId: page.id, title: currentTitle, content: trimmedHTML });
        setLastSavedContent(trimmedHTML);
      } catch (error) {
        console.error('Auto page-break: error saving trimmed page', error);
      }
    }

    // 2. Create a new page and save the overflow content to it
    try {
      const pageId = await createPageMutation.mutateAsync({ noteId });
      if (pageId) {
        // Determine the overflow page title:
        // If the overflow itself has an <h1>, use that; otherwise derive from
        // the current page's title with a Roman numeral continuation suffix.
        let overflowTitle = extractH1Title(overflowHTML);
        let finalOverflowHTML = overflowHTML;

        if (overflowTitle === 'Untitled Page' && currentTitle !== 'Untitled Page') {
          overflowTitle = getNextContinuationTitle(currentTitle);
          // Prepend an <h1> with the continuation title so it appears in the editor
          finalOverflowHTML = `<h1>${overflowTitle}</h1>${overflowHTML}`;
        }

        await savePageMutation.mutateAsync({ pageId, title: overflowTitle, content: finalOverflowHTML });
        const updatedPages = (await refetchPages()).data || [];
        const newPageIndex = updatedPages.length - 1;

        // 3. Navigate to the new page
        setCurrentPageIndex(newPageIndex);
        setCurrentPageContent(finalOverflowHTML);
        setLastSavedContent(finalOverflowHTML);
      }
    } catch (error) {
      console.error('Auto page-break: error creating overflow page', error);
    }
  }, [noteId, currentPageIndex, pages, savePageMutation, createPageMutation, refetchPages, setCurrentPageContent, setLastSavedContent, setCurrentPageIndex]);

  useAutoPageBreak({
    editor,
    enabled: currentView === 'page' && !isSmallScreen,
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
  // Mobile Drawer: auto-close on navigation & lock body scroll
  // ========================================
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [currentView, currentPageIndex]);

  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileDrawerOpen]);

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
  // ========================================
  // Content Components (Simplified for responsive)
  // ========================================

  const sidebarProps = {
    noteId: resolvedNoteId,
    title,
    onTitleChange: handleTitleChange,
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
    onTagInputBlur: () => {
      if (tagInput.trim()) handleAddTag();
      setTimeout(() => setShowTagInput(false), 150);
    },
    onAddTagClick: () => setShowTagInput(true),
    saveStatusIndicator: (
      <div className="flex items-center gap-2">
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
    ),
    onBack: handleBack,
  };

  const aiButtons = [
    { id: 'continue_writing', label: 'Continue', icon: PencilEdit02Icon, title: 'AI continues writing from cursor' },
    { id: 'generate_outline', label: 'Outline', icon: NoteIcon, title: 'Generate heading structure' },
    { id: 'summarize_page', label: 'Summarize', icon: SummationCircleIcon, title: 'Summarize the entire page' },
    { id: 'generate_flashcards', label: 'Flashcards', icon: FlashIcon, title: 'Generate flashcards' },
  ] as const;

  // ========================================
  // Render
  // ========================================

  if (!isNewNote && (isLoadingNote || (!!resolvedNoteId && isLoadingPages))) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loading03Icon className="w-10 h-10 text-primary animate-spin" />
          <p className="text-foreground-muted font-medium">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-background selection:bg-primary/10">
      {/* Desktop Sidebar */}
      {!isSmallScreen && (
        <EditorSidebar {...sidebarProps} className="w-72 shrink-0" />
      )}

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isSmallScreen && sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85%] z-[110]"
            >
              <EditorSidebar {...sidebarProps} onBack={() => setSidebarOpen(false)} className="border-r-0 shadow-2xl" isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header / Top Toolbar */}
        <header className="h-16 shrink-0 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
          <div className="flex items-center gap-3 min-w-0">
            {isSmallScreen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl bg-background-muted hover:bg-border transition-all text-foreground-muted"
              >
                <Menu01Icon className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-bold truncate text-foreground leading-tight">
                {currentView === 'page' && currentPageIndex !== null 
                  ? pages[currentPageIndex]?.title || 'Untitled Page'
                  : currentView === 'toc' ? 'Table of Contents' : 'Notebook Cover'}
              </h1>
              <div className="flex items-center gap-1.5 opacity-60">
                 <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                   {title || 'Untitled Notebook'}
                 </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSmallScreen && (
              <div className="flex items-center gap-2 pr-4 border-r border-border mr-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentView === 'toc' || (currentView === 'page' && currentPageIndex === 0)}
                  className="p-2 rounded-xl hover:bg-background-muted text-foreground-muted disabled:opacity-30 transition-all"
                  title="Previous Page"
                >
                  <ArrowLeft01Icon className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentView === 'page' && currentPageIndex === pages.length - 1}
                  className="p-2 rounded-xl hover:bg-background-muted text-foreground-muted disabled:opacity-30 transition-all"
                  title="Next Page"
                >
                  <ArrowRight01Icon className="w-4.5 h-4.5" />
                </button>
              </div>
            )}
            
            {/* Save indicator on top right for desktop */}
            {!isSmallScreen && sidebarProps.saveStatusIndicator}
          </div>
        </header>

        {/* Dynamic Toolbar (Formatting + AI) */}
        {currentView === 'page' && editor && (
          <div className="shrink-0 border-b border-border bg-surface/50 overflow-hidden">
             <div className="flex flex-col">
                <EditorToolbar editor={editor} fullscreen />
                <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 border-t border-border/50 overflow-x-auto scrollbar-hide">
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/80 pr-3 border-r border-border/50 mr-1 shrink-0">
                    <GoogleGeminiIcon className="w-3.5 h-3.5" />
                    AI Assist
                  </div>
                  <div className="sm:hidden flex items-center pr-2 border-r border-border/50 mr-1 shrink-0">
                     <GoogleGeminiIcon className="w-4 h-4 text-blue-500/80" />
                  </div>
                  {aiButtons.map((action) => {
                    const Icon = action.icon;
                    const isLoading = aiLoading === action.id;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handleAIAction(action.id)}
                        disabled={!editor || Boolean(aiLoading)}
                        title={action.title}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all bg-background-muted border border-border hover:bg-border text-foreground-muted hover:text-foreground disabled:opacity-40 whitespace-nowrap"
                      >
                        {isLoading ? <Loading03Icon className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
             </div>
          </div>
        )}

        {/* Editor Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide relative bg-[#FFFAF0]/30">
          <AnimatePresence mode="wait">
            {currentView === 'cover' ? (
              <motion.div
                key="cover"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="min-h-full flex items-center justify-center p-6 sm:p-12"
              >
                <div className="w-full max-w-md aspect-[3/4.2] shadow-2xl rounded-[2.5rem] overflow-hidden">
                  <ClayNotebookCover
                    mode="editor"
                    title={title}
                    onTitleChange={setTitle}
                    onOpen={handleOpenNotebook}
                    onColorChange={setCoverColor}
                    color={coverColor}
                    theme={theme}
                  />
                </div>
              </motion.div>
            ) : currentView === 'toc' ? (
              isSmallScreen ? (
                /* ── Mobile-Optimised TOC ── */
                <motion.div
                  key="toc-mobile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="min-h-full p-4 pb-28"
                >
                  {/* Header */}
                  <div className="mb-5">
                    <h2 className="text-[11px] font-black text-[#C77B4B] uppercase tracking-[0.2em] mb-1">Contents</h2>
                    <h3 className="text-[18px] font-black text-foreground tracking-tight leading-tight truncate">{title || 'Untitled Notebook'}</h3>
                    <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider mt-1.5 block">
                      {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                    </span>
                  </div>

                  {/* Page cards */}
                  {isLoadingPages ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border animate-pulse">
                          <span className="w-8 h-8 rounded-xl bg-background-muted" />
                          <div className="flex-1 h-4 rounded bg-background-muted" />
                        </div>
                      ))}
                    </div>
                  ) : pages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-3xl bg-background-muted border border-border flex items-center justify-center mb-4">
                        <BookOpen01Icon className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-[13px] font-bold text-foreground">No pages yet</p>
                      <p className="text-[11px] text-foreground-muted mt-1">Tap below to create your first page</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pages.map((p, i) => (
                        <button
                          key={p.id}
                          onClick={() => handlePageClick(i)}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border shadow-sm active:scale-[0.98] active:bg-background-muted transition-all text-left"
                        >
                          <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#F5EADF] text-[#C77B4B] text-[11px] font-black shrink-0">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-foreground truncate">{p.title || 'Untitled Page'}</p>
                          </div>
                          <ArrowRight01Icon className="w-4 h-4 text-foreground-muted/40 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Add page */}
                  <button
                    onClick={handleAddPage}
                    disabled={isLoadingPages}
                    className="w-full mt-4 py-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-primary font-black text-[11px] uppercase tracking-widest active:scale-[0.98] active:bg-background-muted transition-all"
                  >
                    <Add01Icon className="w-4 h-4" />
                    <span>New Page</span>
                  </button>
                </motion.div>
              ) : (
                /* ── Desktop TOC ── */
                <motion.div
                  key="toc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="min-h-full max-w-4xl mx-auto w-full p-3 sm:p-12"
                >
                  <TableOfContents
                    notebookTitle={title}
                    pages={pages}
                    onPageClick={handlePageClick}
                    onAddPage={handleAddPage}
                    onDeletePage={handleDeletePage}
                    theme={theme}
                    isLoading={isLoadingPages}
                  />
                </motion.div>
              )
            ) : (
              <motion.div
                key={`page-${currentPageIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-full flex flex-col items-stretch sm:items-center"
              >
                <div className="w-full sm:max-w-4xl flex-1 flex flex-col relative bg-surface shadow-2xl sm:shadow-xl sm:my-8 sm:rounded-2xl border-x sm:border border-border/50 overflow-hidden ring-1 ring-black/[0.02]">
                   {currentPageIndex !== null && pages[currentPageIndex] ? (
                    <NotebookPage
                      content={currentPageContent}
                      onChange={setCurrentPageContent}
                      theme={theme}
                      onEditorReady={handleEditorReady}
                      simpleMode={true}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                       <div className="w-16 h-16 rounded-full bg-background-muted flex items-center justify-center text-foreground-muted opacity-20">
                         <BookOpen01Icon className="w-8 h-8" />
                       </div>
                       <p className="text-foreground-muted font-bold uppercase tracking-[0.2em] text-[10px]">No page selected</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation (Visible only on small screens when in page view) */}
        {isSmallScreen && currentView === 'page' && (
           <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 p-1.5 bg-surface/80 backdrop-blur-xl border border-border shadow-2xl shadow-black/10 rounded-full">
              <button
                onClick={handlePrevPage}
                disabled={currentPageIndex === 0}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-muted text-foreground-muted disabled:opacity-20 transition-all"
              >
                <ArrowLeft01Icon className="w-5 h-5" />
              </button>
              
              <div className="h-4 w-px bg-border mx-1" />
              
              <button
                onClick={() => setSidebarOpen(true)}
                className="px-4 py-2 flex items-center gap-2 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                Page { (currentPageIndex ?? 0) + 1 } / { pages.length }
              </button>

              <div className="h-4 w-px bg-border mx-1" />

              <button
                onClick={handleNextPage}
                disabled={currentPageIndex === pages.length - 1}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-muted text-foreground-muted disabled:opacity-20 transition-all"
              >
                <ArrowRight01Icon className="w-5 h-5" />
              </button>
           </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useEffect, useCallback, ReactNode, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// UI Components
import { VerticalEditorToolbar, Editor } from '@/component/ui/RichTextEditor';
import PageFlipContainer, { ViewType } from '@/component/ui/PageFlipContainer';
import ClayNotebookCover, { NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import TableOfContents, { NotePage } from '@/component/ui/TableOfContents';
import NotebookPage from '@/component/ui/NotebookPage';

// Icons
import {
  ArrowLeft02Icon,
  Tick01Icon,
  Loading03Icon,
  AlertCircleIcon,
  Home01Icon,
  Cancel01Icon,
  Tag01Icon,
  Book02Icon,
  Menu01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ArrowUpRight01Icon,
  ArrowDownLeft01Icon,
  Add01Icon,
} from 'hugeicons-react';

// Stores
import { useEditorStore, useNoteStore, useUIStore } from '@/stores/editorStore';
import { useThemeStore } from '@/stores/themeStore';

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

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteIdOrSlug = params?.noteId as string | undefined;
  const isNewNote = !noteIdOrSlug || noteIdOrSlug === 'new';

  // Previous content ref for flip animation
  const previousContentRef = useRef<ReactNode>(null);

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

  const { theme, initializeTheme } = useThemeStore();

  // ========================================
  // TanStack Query Hooks
  // ========================================
  const { data: fetchedNote, isLoading: isLoadingNote } = useNote(noteIdOrSlug);
  const { data: pages = [], refetch: refetchPages } = useNotePages(noteId);

  const createNoteMutation = useCreateNote();
  const saveNoteMutation = useSaveNote();
  const createPageMutation = useCreatePage();
  const savePageMutation = useSavePage();
  const deletePageMutation = useDeletePage();

  // ========================================
  // Initialize theme on mount
  // ========================================
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

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
        coverColor: (fetchedNote.cover_color as NotebookColorKey) || 'lavender',
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
  // Note Actions
  // ========================================
  const handleOpenNotebook = async () => {
    if (!title.trim()) return;
    captureCurrentState();

    if (!noteId && isNewNote) {
      try {
        const newId = await createNoteMutation.mutateAsync({ coverColor });
        if (newId) {
          setId(newId);
          setSaveStatus('saved');
          await saveNoteMutation.mutateAsync({ id: newId, title, tags: [], coverColor });
          setCurrentView('toc');
        }
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
        await refetchPages();
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
        } catch (error) {
          console.error('Error saving page:', error);
        }
      }
    }

    await refetchPages();
    navigateToTOC();
  };

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) return;

    try {
      await deletePageMutation.mutateAsync(pageId);
      refetchPages();
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
        refetchPages();
      } catch {
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [currentPageContent, currentPageIndex, pages, lastSavedContent, currentView, setSaveStatus, setLastSavedContent]);

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
          router.replace(`/editor/${newSlug}`, { scroll: false });
        }
      } catch {
        // Silent fail for metadata save
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [noteId, title, tags, coverColor, slug, router, currentView, setSlug]);

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
  // ========================================
  if (isLoadingNote && !isNewNote) {
    const loadingBg = theme === 'dark' ? '#1a1a2e' : '#f9f9f6';
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: loadingBg }}>
        <div className="flex flex-col items-center gap-4">
          <Loading03Icon className="w-10 h-10 text-accent animate-spin" />
          <p style={{ color: theme === 'dark' ? '#b5b5b5' : '#4c4c4c' }}>Loading notebook...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // Theme-based styles
  // ========================================
  const bgColor = theme === 'dark' ? '#1e1e2e' : '#ffffff';
  const borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const textColor = theme === 'dark' ? '#9ca3af' : '#4b5563';
  const iconColor = theme === 'dark' ? '#9ca3af' : '#4b5563';

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
      {/* Header */}
      {showHeader && (
        <header
          className="border-b flex-shrink-0"
          style={{ backgroundColor: bgColor, borderColor }}
        >
          {/* Top row - Title and Actions */}
          <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor }}>
            {currentView === 'page' ? (
              <button
                onClick={handleBackToContents}
                className={`p-1.5 rounded transition-colors flex items-center gap-1.5 ${
                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                title="Back to Contents"
              >
                <Menu01Icon className="w-5 h-5" style={{ color: iconColor }} />
                <span className="text-xs font-medium" style={{ color: textColor }}>Contents</span>
              </button>
            ) : (
              <Link
                href="/notes"
                className={`p-1.5 rounded transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                title="Back to Notebooks"
              >
                <ArrowLeft02Icon className="w-5 h-5" style={{ color: iconColor }} />
              </Link>
            )}

            <div className={`p-1 rounded ${theme === 'dark' ? 'bg-amber-900/20' : 'bg-amber-100/50'}`}>
              <Book02Icon
                className="w-4 h-4"
                style={{ color: theme === 'dark' ? '#d4a574' : '#8b6914' }}
              />
            </div>

            {currentView === 'page' && currentPageIndex !== null && (
              <span className="text-xs font-medium px-2 py-1 rounded" style={{
                color: textColor,
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
              }}>
                Page {currentPageIndex + 1} of {pages.length}
              </span>
            )}

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled notebook"
                className={`w-full text-sm font-normal bg-transparent border-none focus:outline-none focus:ring-0 ${
                  theme === 'dark'
                    ? 'placeholder:text-gray-500 text-gray-100'
                    : 'placeholder:text-gray-400 text-gray-900'
                }`}
                style={{ color: theme === 'dark' ? '#f3f3f3' : '#171717' }}
              />
            </div>

            {/* Save status */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: textColor }}>
                  <Loading03Icon className="w-3.5 h-3.5 animate-spin" style={{ color: textColor }} />
                  <span>Saving...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: textColor }}>
                  <Tick01Icon className="w-3.5 h-3.5" style={{ color: textColor }} />
                  <span>Saved</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs">
                  <AlertCircleIcon className="w-3.5 h-3.5" />
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
                    className="w-24 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                      borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                      color: theme === 'dark' ? '#f3f3f3' : '#171717',
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTagInput(true)}
                    className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                      theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}
                    title="Add tags"
                  >
                    <Tag01Icon className="w-4 h-4" style={{ color: iconColor }} />
                    {tags.length > 0 && (
                      <span className={`text-xs px-1.5 rounded ${
                        theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {tags.length}
                      </span>
                    )}
                  </button>
                )}
              </div>

              <Link
                href="/dashboard"
                className={`p-1.5 rounded transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                title="Dashboard"
              >
                <Home01Icon className="w-5 h-5" style={{ color: iconColor }} />
              </Link>
            </div>
          </div>

          {/* Tags row */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-1.5 overflow-x-auto border-b" style={{ borderColor }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className={`rounded p-0.5 transition-colors ${
                      theme === 'dark' ? 'hover:bg-blue-900/50' : 'hover:bg-blue-100'
                    }`}
                  >
                    <Cancel01Icon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </header>
      )}

      {/* Content Area */}
      <div
        className="flex-1 overflow-hidden flex relative"
        style={{ backgroundColor: theme === 'dark' ? '#12121a' : '#e8e6e0' }}
      >
        {/* Gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: theme === 'dark'
              ? `radial-gradient(ellipse 80% 50% at 20% 80%, rgba(157, 123, 224, 0.08) 0%, transparent 50%),
                 radial-gradient(ellipse 60% 40% at 80% 20%, rgba(99, 102, 241, 0.06) 0%, transparent 50%)`
              : `radial-gradient(ellipse 80% 50% at 20% 80%, rgba(95, 108, 175, 0.08) 0%, transparent 50%),
                 radial-gradient(ellipse 60% 40% at 80% 20%, rgba(180, 160, 120, 0.06) 0%, transparent 50%)`,
          }}
        />

        {/* Main notebook area */}
        <div className="flex-1 overflow-hidden py-8 px-4 relative z-10 flex items-center justify-center">
          <div
            className="relative"
            style={{
              width: '100%',
              maxWidth: '56rem',
              height: currentView === 'cover' ? 'calc(100vh - 64px)' : 'calc(100vh - 140px)',
              minHeight: '500px',
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
                      background: theme === 'dark'
                        ? `linear-gradient(135deg, ${i % 2 === 0 ? '#2a2a3a' : '#252535'} 0%, ${i % 2 === 0 ? '#1e1e2e' : '#1a1a2a'} 100%)`
                        : `linear-gradient(135deg, ${i % 2 === 0 ? '#f8f8f3' : '#f5f5f0'} 0%, ${i % 2 === 0 ? '#f0f0eb' : '#eaeae5'} 100%)`,
                      boxShadow: `0 ${2 + i}px ${4 + i * 2}px rgba(0,0,0,${theme === 'dark' ? 0.3 - i * 0.05 : 0.1 - i * 0.02})`,
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

        {/* Right side control panel */}
        {(currentView === 'toc' || currentView === 'page') && (
          <div
            className="absolute right-0 top-0 bottom-0 flex items-center justify-center z-20"
            style={{ width: 'calc((100% - 56rem) / 2 + 60px)', minWidth: '220px' }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                width: currentView === 'page' ? '160px' : '120px',
                background: theme === 'dark'
                  ? 'linear-gradient(145deg, #2a2a3a 0%, #232333 50%, #1e1e2e 100%)'
                  : 'linear-gradient(160deg, #f8f7f4 0%, #f0efec 50%, #e8e7e4 100%)',
                boxShadow: theme === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                border: theme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : '1px solid rgba(0, 0, 0, 0.06)',
              }}
            >
              {/* Page indicator */}
              <div
                className="p-3 flex items-center justify-center"
                style={{
                  borderBottom: theme === 'dark'
                    ? '1px solid rgba(255,255,255,0.06)'
                    : '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium ${
                    theme === 'dark' ? 'bg-gray-900/60 text-gray-300' : 'bg-white/60 text-gray-600'
                  }`}
                  style={{
                    boxShadow: theme === 'dark'
                      ? 'inset 0 2px 4px rgba(0,0,0,0.4)'
                      : 'inset 0 2px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {currentView === 'toc' ? (
                    <>
                      <Menu01Icon className="w-4 h-4" />
                      <span>Contents</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-handwritten)' }}>
                        {(currentPageIndex ?? 0) + 1}
                      </span>
                      <span className="opacity-60">/ {pages.length}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Navigation controls */}
              <div
                className="p-3"
                style={{
                  borderBottom: theme === 'dark'
                    ? '1px solid rgba(255,255,255,0.06)'
                    : '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleFirstPage}
                    disabled={currentView === 'toc'}
                    className={`w-full h-9 rounded-xl flex items-center justify-center transition-all ${
                      currentView === 'toc'
                        ? 'opacity-30 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300'
                          : 'bg-white/80 hover:bg-white text-gray-600'
                    }`}
                    style={{
                      boxShadow: currentView === 'toc' ? 'none' : (theme === 'dark'
                        ? '0 2px 4px rgba(0,0,0,0.3)'
                        : '0 2px 4px rgba(0,0,0,0.08)'),
                    }}
                    title="Back to Contents"
                  >
                    <ArrowDownLeft01Icon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleLastPage}
                    disabled={currentView === 'page' && currentPageIndex === pages.length - 1}
                    className={`w-full h-9 rounded-xl flex items-center justify-center transition-all ${
                      currentView === 'page' && currentPageIndex === pages.length - 1
                        ? 'opacity-30 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300'
                          : 'bg-white/80 hover:bg-white text-gray-600'
                    }`}
                    style={{
                      boxShadow: (currentView === 'page' && currentPageIndex === pages.length - 1) ? 'none' : (theme === 'dark'
                        ? '0 2px 4px rgba(0,0,0,0.3)'
                        : '0 2px 4px rgba(0,0,0,0.08)'),
                    }}
                    title="Last page"
                  >
                    <ArrowUpRight01Icon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePrevPage}
                    disabled={currentView === 'toc'}
                    className={`w-full h-9 rounded-xl flex items-center justify-center transition-all ${
                      currentView === 'toc'
                        ? 'opacity-30 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300'
                          : 'bg-white/80 hover:bg-white text-gray-600'
                    }`}
                    style={{
                      boxShadow: currentView === 'toc' ? 'none' : (theme === 'dark'
                        ? '0 2px 4px rgba(0,0,0,0.3)'
                        : '0 2px 4px rgba(0,0,0,0.08)'),
                    }}
                    title={currentView === 'page' && currentPageIndex === 0 ? 'Back to Contents' : 'Previous page'}
                  >
                    <ArrowLeft01Icon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleNextPage}
                    disabled={currentView === 'page' && currentPageIndex === pages.length - 1}
                    className={`w-full h-9 rounded-xl flex items-center justify-center transition-all ${
                      currentView === 'page' && currentPageIndex === pages.length - 1
                        ? 'opacity-30 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300'
                          : 'bg-white/80 hover:bg-white text-gray-600'
                    }`}
                    style={{
                      boxShadow: (currentView === 'page' && currentPageIndex === pages.length - 1) ? 'none' : (theme === 'dark'
                        ? '0 2px 4px rgba(0,0,0,0.3)'
                        : '0 2px 4px rgba(0,0,0,0.08)'),
                    }}
                    title={currentView === 'toc' ? 'Go to first page' : 'Next page'}
                  >
                    <ArrowRight01Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editor toolbar */}
              {(currentView === 'page' || currentView === 'toc') && editor && (
                <div
                  className="p-3 overflow-y-auto"
                  style={{
                    maxHeight: 'calc(100vh - 400px)',
                    borderBottom: theme === 'dark'
                      ? '1px solid rgba(255,255,255,0.06)'
                      : '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <VerticalEditorToolbar editor={editor} theme={theme} />
                </div>
              )}

              {/* Add new page */}
              <div className="p-3">
                <button
                  onClick={handleAddPageFromEditor}
                  className={`w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-medium ${
                    theme === 'dark'
                      ? 'bg-indigo-700/60 hover:bg-indigo-600/60 text-indigo-200'
                      : 'bg-indigo-500/90 hover:bg-indigo-600/90 text-white'
                  }`}
                  style={{
                    boxShadow: theme === 'dark'
                      ? '0 2px 8px rgba(99, 102, 241, 0.3)'
                      : '0 2px 8px rgba(99, 102, 241, 0.4)',
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

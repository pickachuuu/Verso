'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNoteActions } from '@/hook/useNoteActions';
import { createClient } from '@/utils/supabase/client';
import RichTextEditor from '@/component/ui/RichTextEditor';
import Link from 'next/link';
import {
  ArrowLeft02Icon,
  Tick01Icon,
  Loading03Icon,
  AlertCircleIcon,
  Home01Icon,
  Menu01Icon,
  Cancel01Icon,
  Add01Icon,
  Tag01Icon,
} from 'hugeicons-react';

const supabase = createClient();

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteIdOrSlug = params?.noteId as string | undefined;
  const { createNote, saveNote, getNoteBySlug } = useNoteActions();

  const [id, setId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [loading, setLoading] = useState(!!noteIdOrSlug && noteIdOrSlug !== 'new');
  const [lastSaved, setLastSaved] = useState({ title: '', content: '', tags: [] as string[] });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sync theme with toolbar and other parts of the app
  useEffect(() => {
    // Get initial theme
    const getTheme = (): 'light' | 'dark' => {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") {
        return stored;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const applyTheme = (newTheme: 'light' | 'dark') => {
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      setTheme(newTheme);
    };

    // Initial theme sync
    const initialTheme = getTheme();
    applyTheme(initialTheme);

    // Listen for theme changes from toolbar
    const handleCustomThemeChange = (e: CustomEvent) => {
      const newTheme = (e.detail as { theme: string }).theme as 'light' | 'dark';
      if (newTheme === "light" || newTheme === "dark") {
        applyTheme(newTheme);
      }
    };

    const handleStorageChange = () => {
      const newTheme = getTheme();
      applyTheme(newTheme);
    };

    window.addEventListener("themechange", handleCustomThemeChange as EventListener);
    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for changes
    const interval = setInterval(() => {
      const currentTheme = getTheme();
      const isDark = document.documentElement.classList.contains("dark");
      if ((currentTheme === "dark" && !isDark) || (currentTheme === "light" && isDark)) {
        applyTheme(currentTheme);
      }
    }, 100);

    return () => {
      window.removeEventListener("themechange", handleCustomThemeChange as EventListener);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch note by slug or ID
  useEffect(() => {
    const fetchNote = async () => {
      if (!noteIdOrSlug || noteIdOrSlug === 'new') return;

      setLoading(true);

      try {
        const note = await getNoteBySlug(noteIdOrSlug);

        if (note) {
          setId(note.id);
          setSlug(note.slug);
          setTitle(note.title || '');
          setContent(note.content || '');
          setTags(note.tags || []);
          setLastSaved({
            title: note.title || '',
            content: note.content || '',
            tags: note.tags || []
          });

          if (note.slug && noteIdOrSlug === note.id) {
            router.replace(`/editor/${note.slug}`, { scroll: false });
          }
        }
      } catch (error) {
        console.error('Error fetching note:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteIdOrSlug]);

  // Create new note when there's no ID and user starts typing title
  useEffect(() => {
    const handleCreateNote = async () => {
      if (!id && (!noteIdOrSlug || noteIdOrSlug === 'new') && title.trim()) {
        try {
          const newId = await createNote();
          if (newId) {
            setId(newId);
            setSaveStatus('saved');
          }
        } catch (error) {
          setSaveStatus('error');
        }
      }
    };

    handleCreateNote();
  }, [title, id, noteIdOrSlug, createNote]);

  // Auto-save effect with slug update
  useEffect(() => {
    if (!id || !title.trim()) return;

    if (
      lastSaved.title === title &&
      lastSaved.content === content &&
      JSON.stringify(lastSaved.tags) === JSON.stringify(tags)
    ) {
      return;
    }

    setSaveStatus('saving');
    const timeoutId = setTimeout(async () => {
      try {
        await saveNote(id, { title, content, tags });
        setSaveStatus('saved');
        setLastSaved({ title, content, tags });

        const { data: updatedNote } = await supabase
          .from('notes')
          .select('slug')
          .eq('id', id)
          .single();

        if (updatedNote?.slug && updatedNote.slug !== slug) {
          setSlug(updatedNote.slug);
          router.replace(`/editor/${updatedNote.slug}`, { scroll: false });
        }
      } catch {
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [id, title, content, tags, saveNote, lastSaved, slug, router]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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

  // Loading state
  if (loading) {
    const loadingBg = theme === 'dark' ? '#1a1a2e' : '#f9f9f6';
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: loadingBg }}>
        <div className="flex flex-col items-center gap-4">
          <Loading03Icon className="w-10 h-10 text-accent animate-spin" />
          <p style={{ color: theme === 'dark' ? '#b5b5b5' : '#4c4c4c' }}>Loading document...</p>
        </div>
      </div>
    );
  }

  const bgColor = theme === 'dark' ? '#1e1e2e' : '#ffffff';
  const borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const textColor = theme === 'dark' ? '#9ca3af' : '#4b5563';
  const iconColor = theme === 'dark' ? '#9ca3af' : '#4b5563';

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Google Docs-style Header */}
      <header
        className="border-b flex-shrink-0"
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor
        }}
      >
        {/* Top row - Title and Actions */}
        <div
          className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ borderColor: borderColor }}
        >
          {/* Back button */}
          <Link
            href="/notes"
            className={`p-1.5 rounded transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
            title="Back to Notes"
          >
            <ArrowLeft02Icon
              className="w-5 h-5"
              style={{ color: iconColor }}
            />
          </Link>

          {/* Document title */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled document"
              className={`w-full text-sm font-normal bg-transparent border-none focus:outline-none focus:ring-0 ${
                theme === 'dark'
                  ? 'placeholder:text-gray-500 text-gray-100'
                  : 'placeholder:text-gray-400 text-gray-900'
              }`}
              style={{
                color: theme === 'dark' ? '#f3f3f3' : '#171717',
              }}
              autoFocus={!noteIdOrSlug || noteIdOrSlug === 'new'}
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
                      theme === 'dark'
                        ? 'bg-blue-900 text-blue-300'
                        : 'bg-blue-100 text-blue-600'
                    }`}>{tags.length}</span>
                  )}
                </button>
              )}
            </div>

            {/* Dashboard link */}
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

        {/* Tags row (if any) */}
        {tags.length > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-1.5 overflow-x-auto border-b"
            style={{ borderColor: borderColor }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                  theme === 'dark'
                    ? 'bg-blue-900/30 text-blue-300'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className={`rounded p-0.5 transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-blue-900/50'
                      : 'hover:bg-blue-100'
                  }`}
                >
                  <Cancel01Icon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Editor Area - Google Docs style */}
      <div className="flex-1 overflow-hidden" style={{ backgroundColor: bgColor }}>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Start typing..."
          className="h-full"
          editorClassName=""
          autoFocus={false}
          fullscreen
        />
      </div>
    </div>
  );
}

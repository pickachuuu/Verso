'use client';

import { useEffect, useState } from 'react';
import { ClayBadge } from '@/component/ui/Clay';
import { useParams, useRouter } from 'next/navigation';
import { useNoteActions } from '@/hook/useNoteActions';
import { createClient } from '@/utils/supabase/client';
import RichTextEditor from '@/component/ui/RichTextEditor';
import {
  Tag01Icon,
  Add01Icon,
  Cancel01Icon,
  Tick01Icon,
  Loading01Icon,
  AlertCircleIcon,
  ArrowLeft01Icon
} from 'hugeicons-react';
import Link from 'next/link';

const supabase = createClient();

export default function NotePage() {
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
  const [loading, setLoading] = useState(!!noteIdOrSlug);
  const [lastSaved, setLastSaved] = useState({ title: '', content: '', tags: [] as string[] });

  // Fetch note by slug or ID
  useEffect(() => {
    const fetchNote = async () => {
      if (!noteIdOrSlug) return;

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
            router.replace(`/notes/${note.slug}`, { scroll: false });
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
      if (!id && !noteIdOrSlug && title.trim()) {
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
          router.replace(`/notes/${updatedNote.slug}`, { scroll: false });
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
        {/* Header skeleton */}
        <div className="clay-card border-b border-border px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="h-6 w-32 bg-background-muted rounded animate-pulse" />
            <div className="h-6 w-20 bg-background-muted rounded-full animate-pulse" />
          </div>
        </div>
        {/* Document skeleton */}
        <div className="flex-1 bg-background-muted/50 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="clay-card-elevated rounded-2xl p-12 min-h-[700px] animate-pulse">
              <div className="h-10 w-2/3 bg-background-muted rounded-lg mb-8" />
              <div className="space-y-4">
                <div className="h-4 w-full bg-background-muted rounded" />
                <div className="h-4 w-5/6 bg-background-muted rounded" />
                <div className="h-4 w-4/6 bg-background-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
      {/* Top Header Bar */}
      <div className="clay-card sticky top-0 z-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Back button */}
          <Link
            href="/notes"
            className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft01Icon className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Notes</span>
          </Link>

          {/* Center: Save Status */}
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-2 text-foreground-muted">
                <Loading01Icon className="w-4 h-4 animate-spin" />
                <span className="text-sm">Saving...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 text-green-600">
                <Tick01Icon className="w-4 h-4" />
                <span className="text-sm">Saved</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircleIcon className="w-4 h-4" />
                <span className="text-sm">Error saving</span>
              </div>
            )}
          </div>

          {/* Right: Tags */}
          <div className="flex items-center gap-2">
            {/* Tag badges */}
            <div className="hidden sm:flex items-center gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-muted text-accent"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-accent hover:text-white rounded-full w-3.5 h-3.5 flex items-center justify-center transition-colors"
                  >
                    <Cancel01Icon className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-foreground-muted">+{tags.length - 3}</span>
              )}
            </div>

            {/* Add tag button/input */}
            {showTagInput ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => {
                    if (tagInput.trim()) handleAddTag();
                    setShowTagInput(false);
                  }}
                  placeholder="Add tag..."
                  className="w-24 px-2 py-1 text-xs bg-background-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                  autoFocus
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTagInput(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-foreground-muted hover:bg-background-muted transition-colors"
              >
                <Tag01Icon className="w-4 h-4" />
                <Add01Icon className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Area - Paper-like centered layout */}
      <div className="flex-1 bg-gradient-to-b from-background-muted/30 to-background-muted/60 overflow-auto">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* The Document "Paper" */}
          <div className="clay-card-elevated rounded-2xl overflow-hidden min-h-[800px] flex flex-col">
            {/* Document Header with Title */}
            <div className="px-8 sm:px-12 pt-10 pb-6 border-b border-border/50">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Document"
                className="w-full text-3xl sm:text-4xl font-bold bg-transparent border-none focus:outline-none placeholder:text-foreground-muted/40 text-foreground"
                aria-label="Document title"
                maxLength={100}
                autoFocus={!noteIdOrSlug}
              />

              {/* Mobile tags display */}
              <div className="flex sm:hidden flex-wrap items-center gap-1.5 mt-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-muted text-accent"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-accent hover:text-white rounded-full w-3.5 h-3.5 flex items-center justify-center transition-colors"
                    >
                      <Cancel01Icon className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {tags.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTagInput(true)}
                    className="text-xs text-foreground-muted hover:text-accent transition-colors"
                  >
                    + Add tags
                  </button>
                )}
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your notes..."
                className="flex-1"
                editorClassName="px-8 sm:px-12 py-6"
                autoFocus={false}
              />
            </div>
          </div>

          {/* Document Footer */}
          {slug && (
            <div className="mt-4 text-center">
              <p className="text-xs text-foreground-muted">
                Shareable URL:{' '}
                <code className="bg-background-muted px-2 py-1 rounded-lg text-accent">
                  /notes/{slug}
                </code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

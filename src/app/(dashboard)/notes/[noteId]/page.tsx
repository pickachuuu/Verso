'use client';

import { useEffect, useRef, useState } from 'react';
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import Button from '@/component/ui/Button';
import { useParams, useRouter } from 'next/navigation';
import { useNoteActions } from '@/hook/useNoteActions';
import { File01Icon, Edit02Icon, ViewIcon } from 'hugeicons-react';
import { createClient } from '@/utils/supabase/client';

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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [loading, setLoading] = useState(!!noteIdOrSlug);
  const [lastSaved, setLastSaved] = useState({ title: '', content: '', tags: [] as string[] });
  const [editing, setEditing] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch note by slug or ID
  useEffect(() => {
    const fetchNote = async () => {
      if (!noteIdOrSlug) return;

      setLoading(true);

      try {
        // Try to fetch by slug first, then by ID
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

          // If we accessed by ID but have a slug, redirect to slug URL
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

    // Only save if something changed
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

        // Update slug in URL if title changed and we have a new slug
        // The slug is regenerated on save, so fetch the updated note
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Markdown list continuation handler
  const handleMarkdownListKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;
      const before = value.slice(0, selectionStart);
      const after = value.slice(selectionEnd);
      const lineStart = before.lastIndexOf('\n') + 1;
      const currentLine = before.slice(lineStart);

      const unorderedMatch = currentLine.match(/^(\s*[-*+] )/);
      const orderedMatch = currentLine.match(/^(\s*)(\d+)\. /);

      if (unorderedMatch) {
        e.preventDefault();
        const insert = '\n' + unorderedMatch[1];
        const newValue = value.slice(0, selectionStart) + insert + after;
        setContent(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + insert.length;
        }, 0);
      } else if (orderedMatch) {
        e.preventDefault();
        const spaces = orderedMatch[1] || '';
        const number = parseInt(orderedMatch[2], 10) + 1;
        const insert = `\n${spaces}${number}. `;
        const newValue = value.slice(0, selectionStart) + insert + after;
        setContent(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + insert.length;
        }, 0);
      }
    }
  };

  // Focus textarea when switching to edit mode
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      if (textarea.selectionStart === textarea.value.length) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    }
  }, [content, editing]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <ClayCard variant="default" padding="lg" className="rounded-2xl animate-pulse">
            <div className="space-y-4">
              <div className="h-8 w-2/3 bg-background-muted rounded-lg" />
              <div className="h-4 w-1/2 bg-background-muted rounded-lg" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-background-muted rounded-full" />
                <div className="h-6 w-12 bg-background-muted rounded-full" />
              </div>
            </div>
          </ClayCard>
          <ClayCard variant="default" padding="none" className="rounded-2xl animate-pulse">
            <div className="p-4 border-b border-border">
              <div className="h-6 w-24 bg-background-muted rounded-lg" />
            </div>
            <div className="h-[600px] bg-background-muted/50" />
          </ClayCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Metadata Card */}
        <ClayCard variant="default" padding="lg" className="rounded-2xl h-fit">
          <div className="space-y-5">
            {/* Title Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground-muted">Title</label>
                <ClayBadge
                  variant={saveStatus === 'saved' ? 'success' : saveStatus === 'saving' ? 'warning' : 'default'}
                  className="text-xs px-2 py-0.5"
                >
                  {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Error'}
                </ClayBadge>
              </div>
              <input
                className="w-full text-xl font-semibold bg-transparent border-b-2 border-transparent focus:border-accent focus:outline-none transition-colors placeholder:text-foreground-muted py-1"
                placeholder="Enter note title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="Note title"
                maxLength={100}
                autoFocus
              />
            </div>

            {/* Tags Section */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground-muted">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {tags.map((tag) => (
                  <ClayBadge
                    key={tag}
                    variant="accent"
                    className="text-sm px-3 py-1 gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-accent hover:text-white rounded-full w-4 h-4 flex items-center justify-center transition-colors text-xs"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </ClayBadge>
                ))}
                {tags.length === 0 && (
                  <span className="text-sm text-foreground-muted">No tags yet</span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 text-sm bg-background-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-foreground-muted"
                  maxLength={50}
                />
                <Button
                  onClick={handleAddTag}
                  variant="outline"
                  size="sm"
                  disabled={!tagInput.trim()}
                  type="button"
                  className="shrink-0 rounded-xl"
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-foreground-muted">
                Press Enter or comma to add
              </p>
            </div>

            {/* Slug Display */}
            {slug && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-foreground-muted">
                  <span className="font-medium">URL:</span>{' '}
                  <code className="bg-background-muted px-1.5 py-0.5 rounded text-accent">
                    /notes/{slug}
                  </code>
                </p>
              </div>
            )}
          </div>
        </ClayCard>

        {/* Editor Card */}
        <ClayCard variant="default" padding="none" className="rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-background-muted/30">
            <div className="flex items-center gap-2">
              <File01Icon className="w-5 h-5 text-accent" />
              <h3 className="font-medium text-foreground">Editor</h3>
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${editing
                  ? 'bg-accent text-white hover:bg-accent/90'
                  : 'bg-background-muted text-foreground hover:bg-background-muted/80'
                }
              `}
            >
              {editing ? (
                <>
                  <ViewIcon className="w-4 h-4" />
                  Preview
                </>
              ) : (
                <>
                  <Edit02Icon className="w-4 h-4" />
                  Edit
                </>
              )}
            </button>
          </div>

          <div className="w-full h-[600px]">
            {editing ? (
              <textarea
                ref={textareaRef}
                className="w-full h-full p-5 resize-none font-mono text-base bg-surface text-foreground focus:outline-none"
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={handleMarkdownListKeyDown}
                placeholder="Write your markdown here..."
                spellCheck={true}
              />
            ) : (
              <div className="w-full h-full p-5 overflow-auto prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
                <Markdown remarkPlugins={[remarkGfm]}>
                  {content || '*Start writing to see preview...*'}
                </Markdown>
              </div>
            )}
          </div>
        </ClayCard>
      </div>
    </div>
  );
}

// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { generateUniqueSlug } from '@/lib/slug';
import { NotebookColorKey } from '@/component/ui/ClayNotebookCover';

const supabase = createClient();

// ============================================
// Types
// ============================================

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  cover_color: string;
  slug: string | null;
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotePage {
  id: string;
  note_id: string;
  title: string;
  content: string;
  page_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Query Keys - Centralized for cache management
// ============================================

export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters: string) => [...noteKeys.lists(), { filters }] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (slug: string) => [...noteKeys.details(), slug] as const,
  pages: (noteId: string) => [...noteKeys.all, 'pages', noteId] as const,
};

// ============================================
// API Functions
// ============================================

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

async function fetchUserNotes(): Promise<Note[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  // Filter out orphaned/empty notes (failed creations that never got a title or content)
  return (data || []).filter(
    (note) =>
      (note.title && note.title.trim() !== '') ||
      (note.content && note.content.trim() !== '') ||
      (Array.isArray(note.tags) && note.tags.length > 0)
  );
}

async function fetchNoteBySlug(slug: string): Promise<Note | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;

  // First try to find by slug
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('slug', slug)
    .single();

  if (error || !data) {
    // Fallback: try to find by ID (for backwards compatibility)
    const { data: dataById, error: errorById } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('id', slug)
      .single();

    if (errorById) {
      console.error('Note not found by slug or ID:', slug);
      return null;
    }

    return dataById;
  }

  return data;
}

async function fetchNotePages(noteId: string): Promise<NotePage[]> {
  const { data, error } = await supabase
    .from('note_pages')
    .select('*')
    .eq('note_id', noteId)
    .order('page_order', { ascending: true });

  if (error) {
    console.error('Error fetching pages:', error);
    throw error;
  }

  return data || [];
}

// ============================================
// Mutation Functions
// ============================================

interface CreateNoteParams {
  title: string;
  coverColor?: NotebookColorKey;
}

async function createNote({ title, coverColor = 'royal' }: CreateNoteParams): Promise<{ id: string; slug: string }> {
  if (!title.trim()) throw new Error('Title is required');

  const session = await getSession();
  if (!session?.user?.id) throw new Error('Not authenticated');

  // Insert with title + slug in one step so we never leave an empty row behind
  const { data, error } = await supabase
    .from('notes')
    .insert([{
      title: title.trim(),
      content: '',
      tags: [],
      cover_color: coverColor,
      user_id: session.user.id,
      slug: null, // placeholder — updated below
    }])
    .select('id')
    .single();

  if (error) throw error;

  // Generate slug using the note ID and update the row
  const slug = generateUniqueSlug(title, data.id);
  const { error: slugError } = await supabase
    .from('notes')
    .update({ slug, updated_at: new Date().toISOString() })
    .eq('id', data.id);

  if (slugError) throw slugError;

  return { id: data.id, slug };
}

interface SaveNoteParams {
  id: string;
  title: string;
  content?: string;
  tags: string[];
  coverColor?: string;
}

async function saveNote({ id, title, content = '', tags, coverColor }: SaveNoteParams): Promise<string | null> {
  if (!title) return null;

  const session = await getSession();
  if (!session?.user?.id) throw new Error('Not authenticated');

  const slug = generateUniqueSlug(title, id);

  const updateData: Record<string, unknown> = {
    title,
    content,
    tags,
    slug,
    user_id: session.user.id,
    updated_at: new Date().toISOString(),
  };

  if (coverColor) {
    updateData.cover_color = coverColor;
  }

  const { error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) throw error;
  return slug;
}

async function deleteNote(id: string): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) throw error;
}

async function toggleNotePublicStatus({ noteId, isPublic }: { noteId: string; isPublic: boolean }): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notes')
    .update({ is_public: isPublic })
    .eq('id', noteId)
    .eq('user_id', session.user.id);

  if (error) throw error;
}

// Page mutations
interface CreatePageParams {
  noteId: string;
  pageOrder?: number;
}

async function createPage({ noteId, pageOrder }: CreatePageParams): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Not authenticated');

  let order = pageOrder;
  if (order === undefined) {
    const { data: existingPages } = await supabase
      .from('note_pages')
      .select('page_order')
      .eq('note_id', noteId)
      .order('page_order', { ascending: false })
      .limit(1);

    order = existingPages && existingPages.length > 0
      ? existingPages[0].page_order + 1
      : 0;
  }

  const { data, error } = await supabase
    .from('note_pages')
    .insert([{
      note_id: noteId,
      title: 'Untitled Page',
      content: '',
      page_order: order,
    }])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

interface SavePageParams {
  pageId: string;
  title?: string;
  content?: string;
}

async function savePage({ pageId, title, content }: SavePageParams): Promise<void> {
  const updateData: { title?: string; content?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;

  const { error } = await supabase
    .from('note_pages')
    .update(updateData)
    .eq('id', pageId);

  if (error) throw error;
}

async function deletePage(pageId: string): Promise<void> {
  const { error } = await supabase
    .from('note_pages')
    .delete()
    .eq('id', pageId);

  if (error) throw error;
}

// ============================================
// Query Hooks
// ============================================

export function useUserNotes() {
  return useQuery({
    queryKey: noteKeys.lists(),
    queryFn: fetchUserNotes,
  });
}

export function useNote(slugOrId: string | undefined) {
  return useQuery({
    queryKey: noteKeys.detail(slugOrId || ''),
    queryFn: () => fetchNoteBySlug(slugOrId!),
    enabled: !!slugOrId && slugOrId !== 'new',
  });
}

export function useNotePages(noteId: string | null | undefined) {
  return useQuery({
    queryKey: noteKeys.pages(noteId || ''),
    queryFn: () => fetchNotePages(noteId!),
    enabled: !!noteId,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

export function useSaveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveNote,
    onSuccess: (_, variables) => {
      // Invalidate the specific note and the list
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

export function useToggleNotePublicStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleNotePublicStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.noteId) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.pages(variables.noteId) });
    },
  });
}

export function useSavePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePage,
    // Optimistic update for better UX
    onMutate: async (variables) => {
      // We'll handle optimistic updates in the component if needed
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePage,
    onSuccess: (_, __, context) => {
      // Invalidate all pages queries
      queryClient.invalidateQueries({ queryKey: ['notes', 'pages'] });
    },
  });
}

// ============================================
// Utility Functions
// ============================================

export function extractH1Title(htmlContent: string): string {
  const match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (match) {
    return match[1].replace(/<[^>]*>/g, '').trim() || 'Untitled Page';
  }
  return 'Untitled Page';
}

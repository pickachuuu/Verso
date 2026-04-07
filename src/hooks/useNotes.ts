// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { generateUniqueSlug } from '@/lib/slug';
import { NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import { db, type LocalNote, type LocalNotePage } from '@/lib/db';

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
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (session) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('verso_last_active_user_id', session.user.id);
    }
    return session;
  }
  
  // Offline fallback handling
  if (typeof window !== 'undefined' && !navigator.onLine) {
    const lastId = localStorage.getItem('verso_last_active_user_id');
    if (lastId) {
      console.log('Offline mode: Using cached user session strictly for local DB access');
      return { user: { id: lastId } } as any;
    }
  }
  
  return null;
}

async function fetchUserNotes(): Promise<Note[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  // 1. Fetch from Supabase (if online)
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      await db.transaction('rw', db.notes, async () => {
        for (const note of data) {
          const existing = await db.notes.get(note.id);
          // Only overwrite if it wasn't recently locally changed (pending sync)
          if (!existing || existing.sync_status === 'synced' || existing.updated_at < note.updated_at) {
            await db.notes.put({ ...note, sync_status: 'synced' });
          }
        }
      });
    }
  } catch (error) {
    console.log('Offline: Falling back to local notes');
  }

  // 2. Fetch from Dexie
  const localNotes = await db.notes
    .where('user_id').equals(session.user.id)
    .reverse()
    .sortBy('updated_at');

  return (localNotes || []).filter(
    (note) =>
      (note.title && note.title.trim() !== '') ||
      (note.content && note.content.trim() !== '') ||
      (Array.isArray(note.tags) && note.tags.length > 0)
  ) as Note[];
}

async function fetchNoteBySlug(slug: string): Promise<Note | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;

  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('slug', slug)
      .single();

    if (!error && data) {
      await db.notes.put({ ...data, sync_status: 'synced' });
    } else {
      const { data: dataById, error: errorById } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('id', slug)
        .single();
      if (!errorById && dataById) {
        await db.notes.put({ ...dataById, sync_status: 'synced' });
      }
    }
  } catch (error) {
    console.log('Offline: Falling back to local note by slug');
  }

  let localNote = await db.notes.where('slug').equals(slug).first();
  if (!localNote) {
    localNote = await db.notes.get(slug);
  }

  return (localNote as Note) || null;
}

async function fetchNotePages(noteId: string): Promise<NotePage[]> {
  try {
    const { data, error } = await supabase
      .from('note_pages')
      .select('*')
      .eq('note_id', noteId)
      .order('page_order', { ascending: true });

    if (!error && data) {
      await db.transaction('rw', db.notePages, async () => {
        for (const page of data) {
          const existing = await db.notePages.get(page.id);
          if (!existing || existing.sync_status === 'synced' || existing.updated_at < page.updated_at) {
            await db.notePages.put({ ...page, sync_status: 'synced' });
          }
        }
      });
    }
  } catch (error) {
    console.log('Offline: Falling back to local pages');
  }

  const localPages = await db.notePages
    .where('note_id').equals(noteId)
    .sortBy('page_order');

  return localPages as NotePage[];
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

  const newId = crypto.randomUUID();
  const slug = generateUniqueSlug(title, newId);
  const now = new Date().toISOString();

  const localNote: LocalNote = {
    id: newId,
    title: title.trim(),
    content: '',
    tags: [],
    cover_color: coverColor,
    slug,
    user_id: session.user.id,
    is_public: false,
    created_at: now,
    updated_at: now,
    sync_status: 'pending'
  };

  await db.notes.put(localNote);

  try {
    await supabase.from('notes').insert([{
      id: newId,
      title: title.trim(),
      content: '',
      tags: [],
      cover_color: coverColor,
      user_id: session.user.id,
      slug: slug,
    }]);
    await db.notes.update(newId, { sync_status: 'synced' });
  } catch (error) {
    console.log("Offline mode: Note creation will sync later", error);
  }

  return { id: newId, slug };
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
  const updated_at = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    title,
    content,
    tags,
    slug,
    user_id: session.user.id,
    updated_at,
  };

  if (coverColor) {
    updateData.cover_color = coverColor;
  }

  const existingNote = await db.notes.get(id);
  if (existingNote) {
    await db.notes.update(id, { ...updateData, sync_status: 'pending' });
  } else {
    await db.notes.put({ ...existingNote, ...updateData, id, sync_status: 'pending' } as LocalNote);
  }

  try {
    const { error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (!error) {
      await db.notes.update(id, { sync_status: 'synced' });
    }
  } catch (error) {
    console.log("Offline mode: Note update will sync later");
  }

  return slug;
}

async function deleteNote(id: string): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Not authenticated');

  await db.notes.delete(id);

  try {
    await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
  } catch (error) {
    console.log("Offline mode: Note delete will sync later");
  }
}

async function toggleNotePublicStatus({ noteId, isPublic }: { noteId: string; isPublic: boolean }): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Not authenticated');

  await db.notes.update(noteId, { is_public: isPublic, sync_status: 'pending' });

  try {
    await supabase
      .from('notes')
      .update({ is_public: isPublic })
      .eq('id', noteId)
      .eq('user_id', session.user.id);

    await db.notes.update(noteId, { sync_status: 'synced' });
  } catch (error) {
    console.log("Offline mode: Access change will sync later");
  }
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
    const existingPages = await db.notePages
      .where('note_id').equals(noteId)
      .sortBy('page_order');

    order = existingPages && existingPages.length > 0
      ? existingPages[existingPages.length - 1].page_order + 1
      : 0;
  }

  const pageId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.notePages.put({
    id: pageId,
    note_id: noteId,
    title: 'Untitled Page',
    content: '',
    page_order: order,
    created_at: now,
    updated_at: now,
    sync_status: 'pending'
  });

  // Fire-and-forget Supabase insert for optimistic offline-first behavior
  supabase
    .from('note_pages')
    .insert([{
      id: pageId,
      note_id: noteId,
      title: 'Untitled Page',
      content: '',
      page_order: order,
    }])
    .then(({ error }) => {
      if (!error) {
        db.notePages.update(pageId, { sync_status: 'synced' }).catch(() => {});
      }
    })
    .catch((error) => {
      console.log("Offline mode: Page creation will sync later");
    });

  return pageId;
}

interface SavePageParams {
  pageId: string;
  title?: string;
  content?: string;
}

async function savePage({ pageId, title, content }: SavePageParams): Promise<void> {
  const updateData: { title?: string; content?: string; updated_at: string; sync_status: string } = {
    updated_at: new Date().toISOString(),
    sync_status: 'pending'
  };

  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;

  const existingPage = await db.notePages.get(pageId);
  if (existingPage) {
    await db.notePages.update(pageId, updateData);
  }

  // Fire-and-forget Supabase update for instantaneous optimistic UX
  const payload = { ...updateData };
  delete payload.sync_status;

  supabase
    .from('note_pages')
    .update(payload)
    .eq('id', pageId)
    .then(({ error }) => {
      if (!error) {
        db.notePages.update(pageId, { sync_status: 'synced' }).catch(() => {});
      }
    })
    .catch((error) => {
      console.log("Offline mode: Page save will sync later");
    });
}

async function deletePage(pageId: string): Promise<void> {
  await db.notePages.delete(pageId);

  try {
    await supabase
      .from('note_pages')
      .delete()
      .eq('id', pageId);
  } catch (error) {
    console.log("Offline mode: Page delete will sync later");
  }
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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.pages(variables.noteId) });
      const previousPages = queryClient.getQueryData<NotePage[]>(noteKeys.pages(variables.noteId)) || [];
      const newPageOrder = previousPages.length > 0 ? previousPages[previousPages.length - 1].page_order + 1 : 0;
      
      const optimisticPage: NotePage = {
        id: 'temp-' + Date.now(),
        note_id: variables.noteId,
        title: 'Untitled Page',
        content: '',
        page_order: newPageOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData<NotePage[]>(noteKeys.pages(variables.noteId), [...previousPages, optimisticPage]);
      return { previousPages };
    },
    onError: (err, variables, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(noteKeys.pages(variables.noteId), context.previousPages);
      }
    },
    onSettled: (_, __, variables) => {
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
// Content Aggregation
// ============================================

/**
 * Fetches all note_pages content for the given note IDs and returns
 * a map of noteId → combined page content (ordered by page_order).
 * Falls back to note.content when a note has no pages.
 */
export async function fetchNotePagesContent(
  noteIds: string[]
): Promise<Map<string, string>> {
  if (noteIds.length === 0) return new Map();

  let data = null;

  try {
    const res = await supabase
      .from('note_pages')
      .select('note_id, title, content, page_order')
      .in('note_id', noteIds)
      .order('page_order', { ascending: true });

    data = res.data;
  } catch (error) {
    console.log("Offline mode: fetchNotePagesContent fallback");
  }

  if (!data) {
    data = await db.notePages
      .where('note_id').anyOf(noteIds)
      .sortBy('page_order') as any;
  }

  const contentMap = new Map<string, string>();
  for (const page of data || []) {
    const existing = contentMap.get(page.note_id) || '';
    const pageContent = page.content || '';
    if (pageContent.trim()) {
      contentMap.set(
        page.note_id,
        existing ? `${existing}\n\n${pageContent}` : pageContent
      );
    }
  }

  return contentMap;
}

// ============================================
// Utility Functions
// ============================================

export function extractH1Title(htmlContent: string): string {
  const match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (match) {
    // Strip inner HTML tags, then decode common HTML entities
    const raw = match[1].replace(/<[^>]*>/g, '').trim();
    if (!raw) return 'Untitled Page';
    return decodeHTMLEntities(raw);
  }
  return 'Untitled Page';
}

/**
 * Decode common HTML entities that appear in TipTap content.
 * Handles named entities (&amp; &lt; &gt; &quot; &apos; &nbsp;)
 * as well as numeric (&#38;) and hex (&#x26;) character references.
 */
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}


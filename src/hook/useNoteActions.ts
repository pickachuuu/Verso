'use client';

import { createClient } from '@/utils/supabase/client';
import { generateUniqueSlug } from '@/lib/slug';

const supabase = createClient();

export function useNoteActions() {
    /**
     * Creates a new empty note and returns its ID
     */
    const createNote = async (coverColor?: string) => {
        const { data: { session } } = await supabase.auth.getSession();

        const { data, error } = await supabase
            .from('notes')
            .insert([{
                title: '',
                content: '',
                tags: [],
                cover_color: coverColor || 'royal',
                user_id: session?.user?.id,
                slug: null // Slug will be generated when title is set
            }])
            .select('id')
            .single();

        if (error) {
            throw error;
        }

        return data?.id;
    };

    /**
     * Saves/updates a note with the given data
     * Automatically generates or updates the slug based on the title
     */
    const saveNote = async (
        id: string,
        { title, content, tags, coverColor }: { title: string; content: string; tags: string[]; coverColor?: string }
    ) => {
        if (!title) return;

        const { data: { session } } = await supabase.auth.getSession();

        // Generate a unique slug from the title using the note's ID
        const slug = generateUniqueSlug(title, id);

        const updateData: Record<string, unknown> = {
            title,
            content,
            tags,
            slug,
            user_id: session?.user?.id,
            updated_at: new Date().toISOString()
        };

        if (coverColor) {
            updateData.cover_color = coverColor;
        }

        const { data, error } = await supabase
            .from('notes')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', session?.user?.id);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        return true;
    };

    /**
     * Fetches all notes for the current user
     */
    const getUserNotes = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return [];

        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', session.user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return [];
        }
        return data || [];
    };

    /**
     * Fetches a single note by its slug
     * Falls back to fetching by ID if slug lookup fails
     */
    const getNoteBySlug = async (slug: string) => {
        const { data: { session } } = await supabase.auth.getSession();
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
    };

    /**
     * Fetches a single note by its ID
     */
    const getNoteById = async (id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return null;

        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Note not found by ID:', id);
            return null;
        }

        return data;
    };

    /**
     * Deletes a note by its ID
     */
    const deleteNote = async (id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id)
            .eq('user_id', session.user.id);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        return true;
    };

    /**
     * Updates the slug for an existing note
     * Useful for regenerating slugs or fixing slug issues
     */
    const updateNoteSlug = async (id: string, title: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) throw new Error('Not authenticated');

        const slug = generateUniqueSlug(title, id);

        const { error } = await supabase
            .from('notes')
            .update({ slug })
            .eq('id', id)
            .eq('user_id', session.user.id);

        if (error) {
            console.error('Error updating slug:', error);
            throw error;
        }

        return slug;
    };

    // =====================
    // Page CRUD Operations
    // =====================

    /**
     * Creates a new page for a note and returns its ID
     */
    const createPage = async (noteId: string, pageOrder?: number) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) throw new Error('Not authenticated');

        // If no pageOrder specified, get the next order number
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
                page_order: order
            }])
            .select('id')
            .single();

        if (error) {
            console.error('Error creating page:', error);
            throw error;
        }

        return data?.id;
    };

    /**
     * Saves/updates a page with the given data
     */
    const savePage = async (
        pageId: string,
        { title, content }: { title?: string; content?: string }
    ) => {
        const updateData: { title?: string; content?: string; updated_at: string } = {
            updated_at: new Date().toISOString()
        };

        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;

        const { error } = await supabase
            .from('note_pages')
            .update(updateData)
            .eq('id', pageId);

        if (error) {
            console.error('Error saving page:', error);
            throw error;
        }

        return true;
    };

    /**
     * Fetches all pages for a note, ordered by page_order
     */
    const getPages = async (noteId: string) => {
        const { data, error } = await supabase
            .from('note_pages')
            .select('*')
            .eq('note_id', noteId)
            .order('page_order', { ascending: true });

        if (error) {
            console.error('Error fetching pages:', error);
            return [];
        }

        return data || [];
    };

    /**
     * Deletes a page by its ID
     */
    const deletePage = async (pageId: string) => {
        const { error } = await supabase
            .from('note_pages')
            .delete()
            .eq('id', pageId);

        if (error) {
            console.error('Error deleting page:', error);
            throw error;
        }

        return true;
    };

    /**
     * Reorders pages by updating their page_order values
     */
    const reorderPages = async (pages: { id: string; page_order: number }[]) => {
        // Update each page's order
        for (const page of pages) {
            const { error } = await supabase
                .from('note_pages')
                .update({ page_order: page.page_order })
                .eq('id', page.id);

            if (error) {
                console.error('Error reordering page:', error);
                throw error;
            }
        }

        return true;
    };

    /**
     * Extracts H1 heading from HTML content to use as page title
     */
    const extractH1Title = (htmlContent: string): string => {
        const match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (match) {
            // Strip HTML tags from the heading content
            return match[1].replace(/<[^>]*>/g, '').trim() || 'Untitled Page';
        }
        return 'Untitled Page';
    };

    return {
        createNote,
        saveNote,
        getUserNotes,
        getNoteBySlug,
        getNoteById,
        deleteNote,
        updateNoteSlug,
        // Page operations
        createPage,
        savePage,
        getPages,
        deletePage,
        reorderPages,
        extractH1Title
    };
}

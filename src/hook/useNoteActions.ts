'use client';

import { createClient } from '@/utils/supabase/client';
import { generateUniqueSlug } from '@/lib/slug';

const supabase = createClient();

export function useNoteActions() {
    /**
     * Creates a new empty note and returns its ID
     */
    const createNote = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        const { data, error } = await supabase
            .from('notes')
            .insert([{
                title: '',
                content: '',
                tags: [],
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
        { title, content, tags }: { title: string; content: string; tags: string[] }
    ) => {
        if (!title) return;

        const { data: { session } } = await supabase.auth.getSession();

        // Generate a unique slug from the title using the note's ID
        const slug = generateUniqueSlug(title, id);

        const { data, error } = await supabase
            .from('notes')
            .update({
                title,
                content,
                tags,
                slug,
                user_id: session?.user?.id,
                updated_at: new Date().toISOString()
            })
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

    return {
        createNote,
        saveNote,
        getUserNotes,
        getNoteBySlug,
        getNoteById,
        deleteNote,
        updateNoteSlug
    };
}

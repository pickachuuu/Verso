-- Migration: Add note_pages table for multi-page notebook support
-- Run this in Supabase SQL Editor

-- Create the note_pages table
CREATE TABLE IF NOT EXISTS public.note_pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'Untitled Page',
    content TEXT DEFAULT '',
    page_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_note_pages_note_id ON public.note_pages(note_id);
CREATE INDEX IF NOT EXISTS idx_note_pages_page_order ON public.note_pages(page_order);

-- Add updated_at trigger
CREATE TRIGGER update_note_pages_updated_at
    BEFORE UPDATE ON public.note_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.note_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access pages from notes they own

CREATE POLICY "Users can view own note pages" ON public.note_pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_pages.note_id
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own note pages" ON public.note_pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_pages.note_id
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own note pages" ON public.note_pages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_pages.note_id
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own note pages" ON public.note_pages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_pages.note_id
            AND notes.user_id = auth.uid()
        )
    );

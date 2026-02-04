-- Row Level Security (RLS) Policies for ReviseA
-- These policies ensure users can only access their own data

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Notes policies
CREATE POLICY "Users can view own notes" ON public.notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- Flashcard sets policies
CREATE POLICY "Users can view own flashcard sets" ON public.flashcard_sets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard sets" ON public.flashcard_sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard sets" ON public.flashcard_sets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard sets" ON public.flashcard_sets
    FOR DELETE USING (auth.uid() = user_id);

-- Flashcards policies
CREATE POLICY "Users can view own flashcards" ON public.flashcards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets
            WHERE id = flashcard_sets.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own flashcards" ON public.flashcards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets
            WHERE id = flashcard_sets.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own flashcards" ON public.flashcards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets
            WHERE id = flashcard_sets.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own flashcards" ON public.flashcards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets
            WHERE id = flashcard_sets.id
            AND user_id = auth.uid()
        )
    );

-- Study sessions policies
CREATE POLICY "Users can view own study sessions" ON public.study_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions" ON public.study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions" ON public.study_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions" ON public.study_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Session results policies
CREATE POLICY "Users can view own session results" ON public.session_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.study_sessions
            WHERE id = session_results.session_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own session results" ON public.session_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.study_sessions
            WHERE id = session_results.session_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own session results" ON public.session_results
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.study_sessions
            WHERE id = session_results.session_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own session results" ON public.session_results
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.study_sessions
            WHERE id = session_results.session_id
            AND user_id = auth.uid()
        )
    );

-- Gemini requests policies
CREATE POLICY "Users can view own gemini requests" ON public.gemini_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gemini requests" ON public.gemini_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gemini requests" ON public.gemini_requests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gemini requests" ON public.gemini_requests
    FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Note pages policies (access via parent note ownership)
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
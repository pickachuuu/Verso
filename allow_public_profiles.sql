-- Migration: Allow public access to basic profile information
-- This enables the community page to show author names and avatars for unauthenticated visitors

-- Check if the policy already exists to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles'
        AND policyname = 'Public can view basic profile info'
    ) THEN
        CREATE POLICY "Public can view basic profile info" ON public.profiles
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Note: This only allows SELECT access.
-- Update and Insert remain restricted to the authenticated owner.

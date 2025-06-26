
-- Disable RLS policies on meeting_recordings table
ALTER TABLE public.meeting_recordings DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on meeting_participants table for consistency
ALTER TABLE public.meeting_participants DISABLE ROW LEVEL SECURITY;

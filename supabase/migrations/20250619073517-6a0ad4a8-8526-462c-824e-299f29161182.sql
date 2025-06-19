
-- Disable RLS on transcriptions table to prevent access issues
ALTER TABLE public.transcriptions DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can create their own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can update their own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can delete their own transcriptions" ON public.transcriptions;

-- Disable RLS on other related tables if they exist
ALTER TABLE public.user_api_keys DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.user_api_keys;

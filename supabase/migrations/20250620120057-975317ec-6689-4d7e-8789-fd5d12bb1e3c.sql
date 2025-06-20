
-- Drop existing policies that might conflict (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Create task_shares table for sharing tasks between users
CREATE TABLE public.task_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'viewer' CHECK (permission_level IN ('viewer', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, shared_with)
);

-- Enable RLS on task_shares
ALTER TABLE public.task_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view shares for tasks they own
CREATE POLICY "Users can view shares for their own tasks" 
  ON public.task_shares 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_shares.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Policy: Users can create shares for tasks they own
CREATE POLICY "Users can create shares for their own tasks" 
  ON public.task_shares 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_shares.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Policy: Users can update shares for tasks they own
CREATE POLICY "Users can update shares for their own tasks" 
  ON public.task_shares 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_shares.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Policy: Users can delete shares for tasks they own
CREATE POLICY "Users can delete shares for their own tasks" 
  ON public.task_shares 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_shares.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Recreate tasks table policies with sharing support
-- Policy: Users can view tasks they own OR tasks shared with them
CREATE POLICY "Users can view their own tasks and shared tasks" 
  ON public.tasks 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.task_shares 
      WHERE task_shares.task_id = tasks.id 
      AND task_shares.shared_with = auth.uid()
    )
  );

-- Policy: Users can insert their own tasks only
CREATE POLICY "Users can create their own tasks" 
  ON public.tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update tasks they own OR shared tasks with editor permission
CREATE POLICY "Users can update their own tasks and shared tasks with editor permission" 
  ON public.tasks 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.task_shares 
      WHERE task_shares.task_id = tasks.id 
      AND task_shares.shared_with = auth.uid() 
      AND task_shares.permission_level = 'editor'
    )
  );

-- Policy: Users can delete tasks they own only
CREATE POLICY "Users can delete their own tasks" 
  ON public.tasks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_task_shares_task_id ON public.task_shares(task_id);
CREATE INDEX idx_task_shares_shared_with ON public.task_shares(shared_with);

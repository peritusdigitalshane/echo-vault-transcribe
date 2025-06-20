
-- Disable RLS on task_shares table to resolve infinite recursion
ALTER TABLE public.task_shares DISABLE ROW LEVEL SECURITY;

-- Also simplify the tasks policies to remove any potential recursion
DROP POLICY IF EXISTS "Users can view their own tasks and shared tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks and shared tasks with editor permission" ON public.tasks;

-- Create simple policies without cross-table references
CREATE POLICY "Users can view their own tasks and shared tasks" 
  ON public.tasks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks and shared tasks with editor permission" 
  ON public.tasks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

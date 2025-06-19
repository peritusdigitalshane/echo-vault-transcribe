
-- Add scheduled_at column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance when querying by scheduled date
CREATE INDEX idx_tasks_scheduled_at ON public.tasks(scheduled_at);

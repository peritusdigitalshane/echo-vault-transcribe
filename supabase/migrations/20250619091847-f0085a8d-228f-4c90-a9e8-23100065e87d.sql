
-- First, let's check what policies exist and drop them to recreate properly
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can create their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;

DROP POLICY IF EXISTS "Users can view their own note tags" ON public.note_tags;
DROP POLICY IF EXISTS "Users can create their own note tags" ON public.note_tags;
DROP POLICY IF EXISTS "Users can delete their own note tags" ON public.note_tags;

-- Now create the policies fresh
-- Enable RLS on all tables (will be ignored if already enabled)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for notes table
CREATE POLICY "Users can view their own notes" 
  ON public.notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
  ON public.notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
  ON public.notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
  ON public.notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for tags table
CREATE POLICY "Users can view their own tags" 
  ON public.tags 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" 
  ON public.tags 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" 
  ON public.tags 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" 
  ON public.tags 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for note_tags table
CREATE POLICY "Users can view their own note tags" 
  ON public.note_tags 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own note tags" 
  ON public.note_tags 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own note tags" 
  ON public.note_tags 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));


-- Create a table for tags
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Add RLS to tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create policies for tags
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

-- Create junction table for note tags
CREATE TABLE public.note_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(note_id, tag_id)
);

-- Add RLS to note_tags table
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for note_tags
CREATE POLICY "Users can view note tags for their notes" 
  ON public.note_tags 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can create note tags for their notes" 
  ON public.note_tags 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete note tags for their notes" 
  ON public.note_tags 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_tags.note_id 
    AND notes.user_id = auth.uid()
  ));

-- Create junction table for transcription tags
CREATE TABLE public.transcription_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transcription_id UUID NOT NULL REFERENCES public.transcriptions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(transcription_id, tag_id)
);

-- Add RLS to transcription_tags table
ALTER TABLE public.transcription_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for transcription_tags
CREATE POLICY "Users can view transcription tags for their transcriptions" 
  ON public.transcription_tags 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.transcriptions 
    WHERE transcriptions.id = transcription_tags.transcription_id 
    AND transcriptions.user_id = auth.uid()
  ));

CREATE POLICY "Users can create transcription tags for their transcriptions" 
  ON public.transcription_tags 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.transcriptions 
    WHERE transcriptions.id = transcription_tags.transcription_id 
    AND transcriptions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete transcription tags for their transcriptions" 
  ON public.transcription_tags 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.transcriptions 
    WHERE transcriptions.id = transcription_tags.transcription_id 
    AND transcriptions.user_id = auth.uid()
  ));

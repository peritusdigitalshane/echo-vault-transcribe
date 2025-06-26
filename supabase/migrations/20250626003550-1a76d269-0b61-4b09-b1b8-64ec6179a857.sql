
-- Create a table for meeting recordings
CREATE TABLE public.meeting_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  audio_file_url TEXT,
  duration TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  meeting_type TEXT DEFAULT 'video_conference',
  participants TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  file_name TEXT,
  file_size BIGINT,
  model_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting recordings
CREATE POLICY "Users can view their own meeting recordings" 
  ON public.meeting_recordings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meeting recordings" 
  ON public.meeting_recordings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meeting recordings" 
  ON public.meeting_recordings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meeting recordings" 
  ON public.meeting_recordings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a table for meeting participants (optional, for future use)
CREATE TABLE public.meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_recording_id UUID REFERENCES public.meeting_recordings(id) ON DELETE CASCADE,
  participant_name TEXT,
  participant_email TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS for participants
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage participants for their meetings" 
  ON public.meeting_participants 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.meeting_recordings 
      WHERE id = meeting_participants.meeting_recording_id 
      AND user_id = auth.uid()
    )
  );


-- Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-recordings', 'audio-recordings', true);

-- Create storage policies for audio recordings
CREATE POLICY "Users can upload their own recordings" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own recordings" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own recordings" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create recordings table
CREATE TABLE public.recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  recording_type TEXT NOT NULL CHECK (recording_type IN ('meeting', 'phone_call', 'interview', 'voice_note')),
  audio_file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  duration TEXT,
  audio_quality TEXT NOT NULL CHECK (audio_quality IN ('low', 'medium', 'high')),
  participants TEXT[],
  consent_given BOOLEAN DEFAULT false,
  scheduled_deletion TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on recordings table
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recordings
CREATE POLICY "Users can view their own recordings" 
  ON public.recordings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recordings" 
  ON public.recordings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings" 
  ON public.recordings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings" 
  ON public.recordings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create recording_tags junction table
CREATE TABLE public.recording_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES public.recordings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on recording_tags table
ALTER TABLE public.recording_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recording_tags
CREATE POLICY "Users can manage their own recording tags" 
  ON public.recording_tags 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.recordings 
      WHERE recordings.id = recording_tags.recording_id 
      AND recordings.user_id = auth.uid()
    )
  );

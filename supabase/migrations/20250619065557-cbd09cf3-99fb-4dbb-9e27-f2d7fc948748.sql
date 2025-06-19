
-- Create a table for system settings
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy that allows super admins to manage settings
CREATE POLICY "Super admins can manage settings" 
  ON public.system_settings 
  FOR ALL 
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Insert default OpenAI model setting
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES ('openai_model', 'whisper-1', 'OpenAI model used for transcription');

-- Update transcriptions table to include more fields for better tracking
ALTER TABLE public.transcriptions 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS model_used TEXT;

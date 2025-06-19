
-- Insert default system settings for OpenAI and other configurations
INSERT INTO public.system_settings (setting_key, setting_value, description) 
VALUES 
  ('openai_model', 'whisper-1', 'Default OpenAI model for transcription'),
  ('max_file_size_mb', '25', 'Maximum file size for uploads in MB'),
  ('allowed_file_types', 'audio/mpeg,audio/wav,audio/mp4,audio/m4a,audio/webm', 'Allowed audio file types for transcription'),
  ('transcription_timeout_seconds', '300', 'Timeout for transcription requests in seconds'),
  ('enable_email_notifications', 'false', 'Enable email notifications for completed transcriptions')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

-- Ensure RLS is enabled on system_settings table
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow super admins to manage system settings
CREATE POLICY "Super admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create policy to allow all authenticated users to read system settings
CREATE POLICY "Authenticated users can read system settings" ON public.system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

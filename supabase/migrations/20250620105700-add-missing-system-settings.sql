
-- Add missing system settings that should exist
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('max_file_size_mb', '25', 'Maximum file size for audio uploads in MB'),
  ('transcription_timeout_seconds', '300', 'Timeout for transcription requests in seconds'),
  ('enable_email_notifications', 'false', 'Enable email notifications for transcription completion')
ON CONFLICT (setting_key) DO NOTHING;

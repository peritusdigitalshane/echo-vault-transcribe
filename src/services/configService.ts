
import { supabase } from "@/integrations/supabase/client";

interface SystemSettings {
  openai_model: string;
  max_file_size_mb: number;
  allowed_file_types: string[];
  transcription_timeout_seconds: number;
  enable_email_notifications: boolean;
}

class ConfigService {
  private settings: SystemSettings | null = null;
  private loading = false;

  async getSettings(): Promise<SystemSettings> {
    if (this.settings && !this.loading) {
      return this.settings;
    }

    if (this.loading) {
      // Wait for current loading to complete
      while (this.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.settings!;
    }

    this.loading = true;
    
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value');

      if (error) {
        console.error('Error fetching system settings:', error);
        // Return default values if database fetch fails
        return this.getDefaultSettings();
      }

      const settingsMap = data?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, string>) || {};

      this.settings = {
        openai_model: settingsMap.openai_model || 'whisper-1',
        max_file_size_mb: parseInt(settingsMap.max_file_size_mb || '25'),
        allowed_file_types: settingsMap.allowed_file_types?.split(',') || ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/webm'],
        transcription_timeout_seconds: parseInt(settingsMap.transcription_timeout_seconds || '300'),
        enable_email_notifications: settingsMap.enable_email_notifications === 'true'
      };

      return this.settings;
    } catch (error) {
      console.error('Error loading system settings:', error);
      return this.getDefaultSettings();
    } finally {
      this.loading = false;
    }
  }

  private getDefaultSettings(): SystemSettings {
    return {
      openai_model: 'whisper-1',
      max_file_size_mb: 25,
      allowed_file_types: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/webm'],
      transcription_timeout_seconds: 300,
      enable_email_notifications: false
    };
  }

  // Method to refresh settings (useful after admin updates)
  async refreshSettings(): Promise<SystemSettings> {
    this.settings = null;
    return this.getSettings();
  }

  // Get specific setting
  async getSetting(key: keyof SystemSettings): Promise<any> {
    const settings = await this.getSettings();
    return settings[key];
  }
}

export const configService = new ConfigService();
export type { SystemSettings };

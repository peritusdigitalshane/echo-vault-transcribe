
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { configService, SystemSettings } from "@/services/configService";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

const SuperAdminSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemSettings | null>(null);
  const [openAIModel, setOpenAIModel] = useState("whisper-1");
  const [maxFileSize, setMaxFileSize] = useState("25");
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      const config = await configService.getSettings();
      setSystemConfig(config);
      setOpenAIModel(config.openai_model);
      setMaxFileSize(config.max_file_size_mb.toString());
    } catch (error) {
      console.error('Error loading system config:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      setSettings(data || []);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update OpenAI model setting
      const { error: modelError } = await supabase
        .from('system_settings')
        .update({
          setting_value: openAIModel,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'openai_model');

      if (modelError) throw modelError;

      // Update max file size setting
      const { error: sizeError } = await supabase
        .from('system_settings')
        .update({
          setting_value: maxFileSize,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'max_file_size_mb');

      if (sizeError) throw sizeError;

      // Refresh the configuration service cache
      await configService.refreshSettings();

      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });

      setIsDialogOpen(false);
      await fetchSettings();
      await loadSystemConfig();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshConfig = async () => {
    setLoading(true);
    try {
      await configService.refreshSettings();
      await loadSystemConfig();
      await fetchSettings();
      toast({
        title: "Configuration Refreshed",
        description: "System configuration has been reloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          System Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>System Settings</DialogTitle>
          <DialogDescription>
            Configure system-wide settings for transcription and other features.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-model">OpenAI Transcription Model</Label>
            <Select value={openAIModel} onValueChange={setOpenAIModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whisper-1">Whisper-1 (Standard)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Model used for audio transcription via OpenAI API
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
            <Input
              id="max-file-size"
              type="number"
              value={maxFileSize}
              onChange={(e) => setMaxFileSize(e.target.value)}
              min="1"
              max="100"
            />
            <p className="text-xs text-muted-foreground">
              Maximum file size for audio uploads
            </p>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Current Settings</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={refreshConfig}
                disabled={loading}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {systemConfig && (
                <>
                  <div className="flex justify-between">
                    <span>OpenAI Model:</span>
                    <span>{systemConfig.openai_model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max File Size:</span>
                    <span>{systemConfig.max_file_size_mb}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeout:</span>
                    <span>{systemConfig.transcription_timeout_seconds}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email Notifications:</span>
                    <span>{systemConfig.enable_email_notifications ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SuperAdminSettings;

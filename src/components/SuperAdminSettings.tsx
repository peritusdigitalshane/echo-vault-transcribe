
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Save, RefreshCw, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { configService, SystemSettings } from "@/services/configService";
import { Badge } from "@/components/ui/badge";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

interface OpenAIModel {
  id: string;
  name: string;
  description: string;
}

const PREDEFINED_MODELS: OpenAIModel[] = [
  { id: "whisper-1", name: "Whisper-1", description: "Standard Whisper model for speech recognition" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and efficient model for audio processing" },
  { id: "gpt-4o", name: "GPT-4o", description: "Advanced model with superior audio understanding" },
];

const SuperAdminSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemSettings | null>(null);
  const [openAIModel, setOpenAIModel] = useState("whisper-1");
  const [customModel, setCustomModel] = useState("");
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [maxFileSize, setMaxFileSize] = useState("25");
  const [timeoutSeconds, setTimeoutSeconds] = useState("300");
  const [emailNotifications, setEmailNotifications] = useState(false);
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
      setTimeoutSeconds(config.transcription_timeout_seconds.toString());
      setEmailNotifications(config.enable_email_notifications);
      
      // Check if current model is custom (not in predefined list)
      const isPredefined = PREDEFINED_MODELS.some(model => model.id === config.openai_model);
      setIsCustomModel(!isPredefined);
      if (!isPredefined) {
        setCustomModel(config.openai_model);
      }
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

  const handleModelSelection = (value: string) => {
    if (value === "custom") {
      setIsCustomModel(true);
      setOpenAIModel("");
    } else {
      setIsCustomModel(false);
      setOpenAIModel(value);
      setCustomModel("");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const modelToSave = isCustomModel ? customModel : openAIModel;
      
      if (!modelToSave.trim()) {
        throw new Error("Please specify an OpenAI model");
      }

      // Update all settings
      const settingsToUpdate = [
        { key: 'openai_model', value: modelToSave },
        { key: 'max_file_size_mb', value: maxFileSize },
        { key: 'transcription_timeout_seconds', value: timeoutSeconds },
        { key: 'enable_email_notifications', value: emailNotifications.toString() }
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            setting_key: setting.key,
            setting_value: setting.value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'setting_key'
          });

        if (error) throw error;
      }

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>System Settings</DialogTitle>
          <DialogDescription>
            Configure system-wide settings for transcription and other features.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* OpenAI Model Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">OpenAI Configuration</CardTitle>
              <CardDescription>
                Configure the AI model used for transcription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Model Selection</Label>
                <Select 
                  value={isCustomModel ? "custom" : openAIModel} 
                  onValueChange={handleModelSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or add a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <div className="flex items-center">
                        <Plus className="h-3 w-3 mr-2" />
                        <span>Custom Model</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isCustomModel && (
                <div className="space-y-2">
                  <Label htmlFor="custom-model">Custom Model Name</Label>
                  <Input
                    id="custom-model"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g., whisper-large-v3"
                    required={isCustomModel}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the exact model identifier as expected by the OpenAI API
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Processing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">File Processing</CardTitle>
              <CardDescription>
                Configure file upload and processing limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="timeout">Transcription Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(e.target.value)}
                  min="60"
                  max="1800"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum time to wait for transcription completion
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>
                Configure system notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="email-notifications"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="email-notifications">Enable email notifications</Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Send email notifications when transcriptions are completed
              </p>
            </CardContent>
          </Card>
          
          {/* Current Settings Display */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Current Configuration</CardTitle>
                  <CardDescription>Active system settings</CardDescription>
                </div>
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
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {systemConfig && (
                  <>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">OpenAI Model:</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{systemConfig.openai_model}</Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Max File Size:</span>
                      <span className="font-medium">{systemConfig.max_file_size_mb}MB</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Timeout:</span>
                      <span className="font-medium">{systemConfig.transcription_timeout_seconds}s</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Email Notifications:</span>
                      <Badge variant={systemConfig.enable_email_notifications ? "default" : "secondary"}>
                        {systemConfig.enable_email_notifications ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

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

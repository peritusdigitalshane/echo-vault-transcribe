
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

const SuperAdminSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [openAIModel, setOpenAIModel] = useState("whisper-1");
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      setSettings(data || []);
      
      // Set current OpenAI model
      const modelSetting = data?.find(s => s.setting_key === 'openai_model');
      if (modelSetting) {
        setOpenAIModel(modelSetting.setting_value);
      }
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
      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: openAIModel,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'openai_model');

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });

      setIsDialogOpen(false);
      await fetchSettings();
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
          
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Current Settings</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              {settings.map((setting) => (
                <div key={setting.id} className="flex justify-between">
                  <span>{setting.setting_key}:</span>
                  <span>{setting.setting_value}</span>
                </div>
              ))}
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

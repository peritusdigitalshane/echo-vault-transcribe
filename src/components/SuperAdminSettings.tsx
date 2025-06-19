
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, RefreshCw, Key, CreditCard, Zap } from "lucide-react";
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
  const [openAIKey, setOpenAIKey] = useState("");
  const [maxFileSize, setMaxFileSize] = useState("25");
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState("300");
  const [allowedFileTypes, setAllowedFileTypes] = useState("audio/mpeg,audio/wav,audio/mp4,audio/m4a,audio/webm");
  
  // Stripe Settings
  const [stripePublicKey, setStripePublicKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [subscriptionPriceId, setSubscriptionPriceId] = useState("");
  const [oneTimePriceId, setOneTimePriceId] = useState("");
  
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
      setEnableEmailNotifications(config.enable_email_notifications);
      setAllowedFileTypes(config.allowed_file_types.join(','));
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

      const settingsData = data || [];
      setSettings(settingsData);

      // Load current values
      const settingsMap = settingsData.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, string>);

      setOpenAIKey(settingsMap.openai_api_key || "");
      setStripePublicKey(settingsMap.stripe_public_key || "");
      setStripeSecretKey(settingsMap.stripe_secret_key || "");
      setStripeWebhookSecret(settingsMap.stripe_webhook_secret || "");
      setSubscriptionPriceId(settingsMap.subscription_price_id || "");
      setOneTimePriceId(settingsMap.one_time_price_id || "");
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
      const settingsToUpdate = [
        { key: 'openai_model', value: openAIModel, description: 'OpenAI model for transcription' },
        { key: 'openai_api_key', value: openAIKey, description: 'OpenAI API key for transcription service' },
        { key: 'max_file_size_mb', value: maxFileSize, description: 'Maximum file size for uploads in MB' },
        { key: 'transcription_timeout_seconds', value: timeoutSeconds, description: 'Timeout for transcription requests' },
        { key: 'enable_email_notifications', value: enableEmailNotifications.toString(), description: 'Enable email notifications' },
        { key: 'allowed_file_types', value: allowedFileTypes, description: 'Allowed audio file types' },
        { key: 'stripe_public_key', value: stripePublicKey, description: 'Stripe publishable key' },
        { key: 'stripe_secret_key', value: stripeSecretKey, description: 'Stripe secret key' },
        { key: 'stripe_webhook_secret', value: stripeWebhookSecret, description: 'Stripe webhook endpoint secret' },
        { key: 'subscription_price_id', value: subscriptionPriceId, description: 'Stripe subscription price ID' },
        { key: 'one_time_price_id', value: oneTimePriceId, description: 'Stripe one-time payment price ID' },
      ];

      for (const setting of settingsToUpdate) {
        if (setting.value) { // Only update non-empty values
          const { error } = await supabase
            .from('system_settings')
            .upsert({
              setting_key: setting.key,
              setting_value: setting.value,
              description: setting.description,
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'setting_key'
            });

          if (error) throw error;
        }
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>System Settings</DialogTitle>
          <DialogDescription>
            Configure system-wide settings for transcription, payments, and other platform features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveSettings}>
          <Tabs defaultValue="transcription" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transcription">
                <Zap className="h-4 w-4 mr-2" />
                Transcription
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="api-keys">
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcription" className="space-y-4 mt-6">
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

              <div className="space-y-2">
                <Label htmlFor="timeout">Transcription Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(e.target.value)}
                  min="60"
                  max="3600"
                />
                <p className="text-xs text-muted-foreground">
                  Timeout for transcription requests
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-types">Allowed File Types</Label>
                <Textarea
                  id="file-types"
                  value={allowedFileTypes}
                  onChange={(e) => setAllowedFileTypes(e.target.value)}
                  placeholder="audio/mpeg,audio/wav,audio/mp4,audio/m4a,audio/webm"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of allowed MIME types
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="email-notifications"
                  checked={enableEmailNotifications}
                  onCheckedChange={setEnableEmailNotifications}
                />
                <Label htmlFor="email-notifications">Enable Email Notifications</Label>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="stripe-public-key">Stripe Publishable Key</Label>
                <Input
                  id="stripe-public-key"
                  type="text"
                  value={stripePublicKey}
                  onChange={(e) => setStripePublicKey(e.target.value)}
                  placeholder="pk_test_..."
                />
                <p className="text-xs text-muted-foreground">
                  Stripe publishable key for frontend payments
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription-price-id">Subscription Price ID</Label>
                <Input
                  id="subscription-price-id"
                  type="text"
                  value={subscriptionPriceId}
                  onChange={(e) => setSubscriptionPriceId(e.target.value)}
                  placeholder="price_..."
                />
                <p className="text-xs text-muted-foreground">
                  Stripe price ID for monthly subscriptions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="one-time-price-id">One-time Payment Price ID</Label>
                <Input
                  id="one-time-price-id"
                  type="text"
                  value={oneTimePriceId}
                  onChange={(e) => setOneTimePriceId(e.target.value)}
                  placeholder="price_..."
                />
                <p className="text-xs text-muted-foreground">
                  Stripe price ID for one-time payments
                </p>
              </div>
            </TabsContent>

            <TabsContent value="api-keys" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  value={openAIKey}
                  onChange={(e) => setOpenAIKey(e.target.value)}
                  placeholder="sk-..."
                />
                <p className="text-xs text-muted-foreground">
                  OpenAI API key for transcription services
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripe-secret-key">Stripe Secret Key</Label>
                <Input
                  id="stripe-secret-key"
                  type="password"
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  placeholder="sk_test_..."
                />
                <p className="text-xs text-muted-foreground">
                  Stripe secret key for backend payment processing
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripe-webhook-secret">Stripe Webhook Secret</Label>
                <Input
                  id="stripe-webhook-secret"
                  type="password"
                  value={stripeWebhookSecret}
                  onChange={(e) => setStripeWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                />
                <p className="text-xs text-muted-foreground">
                  Stripe webhook endpoint secret for secure event handling
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="pt-6 border-t mt-6">
            <div className="flex items-center justify-between mb-4">
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
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SuperAdminSettings;

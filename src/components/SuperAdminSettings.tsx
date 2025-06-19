
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, RefreshCw, CreditCard, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { configService, SystemSettings } from "@/services/configService";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

interface StripeSettings {
  id: string;
  price_amount: number;
  price_currency: string;
  price_interval: string;
  stripe_price_id: string | null;
}

const SuperAdminSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemSettings | null>(null);
  const [stripeSettings, setStripeSettings] = useState<StripeSettings | null>(null);
  const [openAIModel, setOpenAIModel] = useState("whisper-1");
  const [maxFileSize, setMaxFileSize] = useState("25");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [priceAmount, setPriceAmount] = useState("995");
  const [priceCurrency, setPriceCurrency] = useState("aud");
  const [priceInterval, setPriceInterval] = useState("month");
  const [stripePriceId, setStripePriceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    loadSystemConfig();
    fetchStripeSettings();
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

  const fetchStripeSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setStripeSettings(data);
        setPriceAmount(data.price_amount.toString());
        setPriceCurrency(data.price_currency);
        setPriceInterval(data.price_interval);
        setStripePriceId(data.stripe_price_id || "");
      }
    } catch (error: any) {
      console.error('Error fetching Stripe settings:', error);
    }
  };

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
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

      await configService.refreshSettings();

      toast({
        title: "System Settings Saved",
        description: "System settings have been updated successfully.",
      });

      await fetchSettings();
      await loadSystemConfig();
    } catch (error: any) {
      console.error('Error saving system settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save system settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStripeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save Stripe secret key as a Supabase secret
      if (stripeSecretKey.trim()) {
        const { error: secretError } = await supabase.functions.invoke('set-stripe-secret', {
          body: { secret_key: stripeSecretKey }
        });

        if (secretError) {
          console.warn('Could not save secret via function, this is expected in development');
        }
      }

      // Update Stripe settings in database
      const stripeData = {
        price_amount: parseInt(priceAmount),
        price_currency: priceCurrency,
        price_interval: priceInterval,
        stripe_price_id: stripePriceId || null,
        updated_at: new Date().toISOString()
      };

      if (stripeSettings) {
        // Update existing
        const { error } = await supabase
          .from('stripe_settings')
          .update(stripeData)
          .eq('id', stripeSettings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('stripe_settings')
          .insert(stripeData);

        if (error) throw error;
      }

      toast({
        title: "Stripe Settings Saved",
        description: "Stripe configuration has been updated successfully. Note: Secret key should be set in Supabase Edge Function secrets manually.",
      });

      await fetchStripeSettings();
      setStripeSecretKey(""); // Clear the input for security
    } catch (error: any) {
      console.error('Error saving Stripe settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save Stripe settings.",
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
      await fetchStripeSettings();
      toast({
        title: "Configuration Refreshed",
        description: "All configurations have been reloaded.",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>System Settings</DialogTitle>
          <DialogDescription>
            Configure system-wide settings for transcription, payments, and other features.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="stripe">Stripe Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-4">
            <form onSubmit={handleSaveSystemSettings} className="space-y-4">
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
                {loading ? "Saving..." : "Save System Settings"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="stripe" className="space-y-4">
            <form onSubmit={handleSaveStripeSettings} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="stripe-secret"
                    type="password"
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                    placeholder="sk_test_... or sk_live_..."
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your Stripe secret key. This should also be set in Supabase Edge Function secrets as STRIPE_SECRET_KEY.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-amount">Price Amount (cents)</Label>
                  <Input
                    id="price-amount"
                    type="number"
                    value={priceAmount}
                    onChange={(e) => setPriceAmount(e.target.value)}
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Price in cents (995 = $9.95)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-currency">Currency</Label>
                  <Select value={priceCurrency} onValueChange={setPriceCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aud">AUD</SelectItem>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price-interval">Billing Interval</Label>
                <Select value={priceInterval} onValueChange={setPriceInterval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripe-price-id">Stripe Price ID (Optional)</Label>
                <Input
                  id="stripe-price-id"
                  value={stripePriceId}
                  onChange={(e) => setStripePriceId(e.target.value)}
                  placeholder="price_1234567890"
                />
                <p className="text-xs text-muted-foreground">
                  Existing Stripe Price ID if you have one created
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Current Stripe Settings</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {stripeSettings && (
                    <>
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span>{(stripeSettings.price_amount / 100).toFixed(2)} {stripeSettings.price_currency.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interval:</span>
                        <span>{stripeSettings.price_interval}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price ID:</span>
                        <span>{stripeSettings.stripe_price_id || 'Not set'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <CreditCard className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Stripe Settings"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SuperAdminSettings;

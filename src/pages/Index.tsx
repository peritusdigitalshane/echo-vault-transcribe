import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, FileAudio, Sparkles, Shield, Cloud, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { createSuperAdminAccount } from "@/utils/createSuperAdmin";

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [superAdminStatus, setSuperAdminStatus] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize super admin account
    const initializeSuperAdmin = async () => {
      console.log('Initializing super admin...');
      setSuperAdminStatus("Creating super admin account...");
      
      try {
        const result = await createSuperAdminAccount();
        console.log('Super admin creation result:', result);
        
        if (result.success) {
          if (result.alreadyExists) {
            setSuperAdminStatus("Super admin account ready");
            console.log('Super admin already exists');
          } else {
            setSuperAdminStatus("Super admin account created successfully");
            toast({
              title: "Super Admin Created",
              description: "Super admin account has been created. You can now login.",
            });
          }
        } else {
          setSuperAdminStatus("Failed to create super admin account");
          console.error('Failed to create super admin:', result.error);
          toast({
            title: "Super Admin Creation Failed",
            description: result.error?.message || "Unknown error occurred",
            variant: "destructive",
          });
        }
      } catch (error) {
        setSuperAdminStatus("Error during super admin creation");
        console.error('Error in super admin initialization:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to initialize super admin account",
          variant: "destructive",
        });
      }
    };

    initializeSuperAdmin();
  }, [toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('Authentication attempt:', { email, isLogin });

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        console.log('Login result:', { data, error });
        
        if (error) {
          console.error('Login error:', error);
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          console.log('Login successful, user:', data.user);
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
              role: 'customer',
            },
          },
        });
        
        console.log('Signup result:', { error });
        
        if (error) {
          console.error('Signup error:', error);
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account Created!",
            description: "Please check your email to confirm your account.",
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Mic,
      title: "Real-time Recording",
      description: "Crystal-clear audio capture with advanced noise cancellation"
    },
    {
      icon: FileAudio,
      title: "File Upload",
      description: "Support for MP3, WAV, and other popular audio formats"
    },
    {
      icon: Sparkles,
      title: "AI Transcription",
      description: "Powered by OpenAI Whisper for accurate speech-to-text"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Enterprise-grade security with encrypted storage"
    },
    {
      icon: Cloud,
      title: "Cloud Storage",
      description: "Access your transcripts anywhere, anytime"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get transcriptions in seconds, not minutes"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">
            <span className="gradient-text">Lyfe Personal Scribe</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your personal AI-powered transcription assistant. Transform your meetings, interviews, 
            and voice notes into searchable, actionable text with precision.
          </p>
          {superAdminStatus && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-400 rounded-md text-blue-800 max-w-md mx-auto">
              <p className="text-sm">
                <strong>System Status:</strong> {superAdminStatus}
                {superAdminStatus.includes("ready") || superAdminStatus.includes("successfully") ? (
                  <>
                    <br />
                    <strong>Super Admin Account:</strong><br />
                    Email: admin@lyfescribe.com<br />
                    Password: SuperAdmin123!
                  </>
                ) : null}
              </p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Features */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="glass-card glow-effect hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6">
                    <feature.icon className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right side - Auth Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md glass-card glow-effect">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl gradient-text">Welcome to Lyfe Personal Scribe</CardTitle>
                <CardDescription>
                  Sign in to access your personal transcription dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={isLogin ? "login" : "signup"} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger 
                      value="login" 
                      onClick={() => setIsLogin(true)}
                      className="data-[state=active]:bg-primary/20"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      onClick={() => setIsLogin(false)}
                      className="data-[state=active]:bg-primary/20"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={handleAuth} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-background/50 border-white/20 focus:border-primary"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                          id="password" 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-background/50 border-white/20 focus:border-primary"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        disabled={loading}
                      >
                        {loading ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4">
                    <form onSubmit={handleAuth} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          type="text" 
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="bg-background/50 border-white/20 focus:border-primary"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-signup">Email</Label>
                        <Input 
                          id="email-signup" 
                          type="email" 
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-background/50 border-white/20 focus:border-primary"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-signup">Password</Label>
                        <Input 
                          id="password-signup" 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-background/50 border-white/20 focus:border-primary"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        disabled={loading}
                      >
                        {loading ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Powered by OpenAI Whisper</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

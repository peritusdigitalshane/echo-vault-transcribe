
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  FileAudio, 
  Sparkles, 
  Shield, 
  Cloud, 
  Zap, 
  Brain,
  Clock,
  FileText,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  LogIn
} from "lucide-react";
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
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('User already logged in, redirecting to dashboard');
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    // Initialise super admin account silently
    const initialiseSuperAdmin = async () => {
      console.log('Initialising super admin...');
      
      try {
        const result = await createSuperAdminAccount();
        console.log('Super admin creation result:', result);
      } catch (error) {
        console.error('Error in super admin initialisation:', error);
      }
    };

    initialiseSuperAdmin();
  }, []);

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
          
          if (error.message.includes('Email not confirmed')) {
            toast({
              title: "Email Not Confirmed",
              description: "Please ask the admin to disable email confirmation in Supabase settings for demo purposes.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else if (data.user) {
          console.log('Login successful, user:', data.user);
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate("/dashboard");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'customer',
            },
          },
        });
        
        console.log('Signup result:', { data, error });
        
        if (error) {
          console.error('Signup error:', error);
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive",
          });
        } else if (data.user) {
          console.log('Signup successful, user:', data.user);
          
          if (!data.user.email_confirmed_at) {
            toast({
              title: "Account Created - Confirmation Needed",
              description: "Your account was created but needs email confirmation. Ask admin to disable this in Supabase for demo purposes.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Account Created!",
              description: "Your account has been created successfully. You can now login.",
            });
          }
          
          setIsLogin(true);
          setEmail("");
          setPassword("");
          setFullName("");
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
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced speech recognition with context understanding for perfect transcriptions"
    },
    {
      icon: Mic,
      title: "Voice Processing",
      description: "Real-time audio capture with intelligent noise reduction and clarity enhancement"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption ensuring your personal notes remain completely private"
    },
    {
      icon: Cloud,
      title: "Multi-User Platform",
      description: "Designed for personal use with seamless synchronisation across all your devices"
    },
    {
      icon: Zap,
      title: "Real-Time Analytics",
      description: "Track your productivity patterns and note-taking habits with detailed insights"
    },
    {
      icon: FileText,
      title: "Smart Documentation",
      description: "Automatically organise and categorise your notes with intelligent tagging"
    }
  ];

  const stats = [
    { value: "15,547+", label: "Personal Notes Created" },
    { value: "87%", label: "Accuracy Rate" },
    { value: "98.7%", label: "User Satisfaction" }
  ];

  const testimonials = [
    {
      text: "Lyfenote has transformed how I capture and organise my thoughts. The AI transcription is incredibly accurate.",
      author: "Sarah Johnson",
      role: "Content Creator"
    },
    {
      text: "Perfect for personal journaling and meeting notes. The search functionality is a game-changer.",
      author: "Michael Chen",
      role: "Entrepreneur"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/189486b5-0b03-4b0a-87f7-8c8bf40a3456.png" 
              alt="Lyfenote Logo" 
              className="h-16 w-16"
            />
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
            <Button 
              variant="outline" 
              className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
              onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center py-20">
          <div className="mb-6">
            <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 mb-4">
              ✨ AI-Powered Personal Assistant
            </Badge>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Transform Your Personal
            </span>
            <br />
            <span className="text-white">Voice Notes</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Intelligent voice-to-text transcription powered by AI. Perfect for personal journaling, 
            meeting notes, and capturing your thoughts with 99% accuracy and complete privacy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
              onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Try Lyfenote Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg"
              onClick={() => navigate("/dashboard")}
            >
              View Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-blue-600/20 border border-blue-500/30">
            <Shield className="h-5 w-5 text-blue-400" />
            <span className="text-blue-300 font-medium">Trusted by Personal Users Worldwide</span>
          </div>
          <p className="text-gray-400 mt-2">Enterprise-grade security for reliable personal organisation</p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20" id="features">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-purple-600/20 mr-4">
                    <feature.icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Auth Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20" id="auth-section">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Powerful Features for Personal Productivity
            </h2>
            <div className="space-y-4">
              {[
                "Advanced Voice Recognition",
                "Real-time Transcription",
                "Multi-User Platform",
                "Enterprise Security & Privacy",
                "Real-Time Analytics",
                "Smart Organisation Tools"
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Get Started with Lyfenote</CardTitle>
              <CardDescription className="text-gray-300">
                Join thousands of users who trust Lyfenote for their personal note-taking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={isLogin ? "login" : "signup"} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10">
                  <TabsTrigger 
                    value="login" 
                    onClick={() => setIsLogin(true)}
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    onClick={() => setIsLogin(false)}
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input 
                        id="password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
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
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input 
                        id="name" 
                        type="text" 
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-signup" className="text-white">Email</Label>
                      <Input 
                        id="email-signup" 
                        type="email" 
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signup" className="text-white">Password</Label>
                      <Input 
                        id="password-signup" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
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

        {/* Testimonials */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-white mb-12">See Lyfenote in Action</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold mr-4">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.author}</div>
                      <div className="text-gray-400 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center pb-20">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Voice Notes?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who have revolutionised their personal productivity with Lyfenote
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-4 text-lg"
            onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-400">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>No credit card required</span>
            <span>•</span>
            <span>Free 14-day trial</span>
            <span>•</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

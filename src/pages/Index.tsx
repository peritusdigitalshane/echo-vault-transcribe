
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
  LogIn,
  Play,
  BarChart3
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
      description: "Advanced speech recognition with context understanding for perfect transcriptions",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Mic,
      title: "Voice Processing",
      description: "Real-time audio capture with intelligent noise reduction and clarity enhancement",
      gradient: "from-blue-500 to-purple-500"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption ensuring your personal notes remain completely private",
      gradient: "from-green-500 to-blue-500"
    },
    {
      icon: Cloud,
      title: "Multi-User Platform",
      description: "Designed for personal use with seamless synchronisation across all your devices",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      icon: Zap,
      title: "Real-Time Analytics",
      description: "Track your productivity patterns and note-taking habits with detailed insights",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: FileText,
      title: "Smart Documentation",
      description: "Automatically organise and categorise your notes with intelligent tagging",
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  const stats = [
    { value: "15,547+", label: "Personal Notes Created", icon: FileText },
    { value: "87%", label: "Accuracy Rate", icon: BarChart3 },
    { value: "98.7%", label: "User Satisfaction", icon: Star }
  ];

  const testimonials = [
    {
      text: "Lyfenote has transformed how I capture and organise my thoughts. The AI transcription is incredibly accurate.",
      author: "Sarah Johnson",
      role: "Content Creator",
      avatar: "SJ"
    },
    {
      text: "Perfect for personal journaling and meeting notes. The search functionality is a game-changer.",
      author: "Michael Chen",
      role: "Entrepreneur",
      avatar: "MC"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Modern Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Lyfenote</h1>
              <p className="text-xs text-purple-300">AI Voice Transcription</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Pricing</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">About</a>
            <Button 
              variant="outline" 
              size="sm"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:text-white backdrop-blur-sm"
              onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center py-20">
          <div className="mb-8">
            <Badge className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-200 border-purple-500/30 mb-6 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              AI-Powered Personal Assistant
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Transform Your
            </span>
            <br />
            <span className="text-white">Voice Into Text</span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Intelligent voice-to-text transcription powered by AI. Perfect for personal journaling, 
            meeting notes, and capturing your thoughts with enterprise-grade accuracy and privacy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm"
              onClick={() => navigate("/dashboard")}
            >
              <Play className="mr-2 h-5 w-5" />
              View Demo
            </Button>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/5 transition-all duration-300">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${index === 0 ? 'from-purple-500 to-pink-500' : index === 1 ? 'from-blue-500 to-cyan-500' : 'from-green-500 to-teal-500'}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Features Grid */}
        <div className="mb-20" id="features">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to transform your voice into organized, searchable text
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mr-4`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Auth Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20" id="auth-section">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white">
              Ready to Get Started?
            </h2>
            <div className="space-y-4">
              {[
                "Advanced Voice Recognition",
                "Real-time Transcription",
                "Multi-User Platform",
                "Enterprise Security & Privacy",
                "Smart Analytics Dashboard",
                "Intelligent Organization"
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-gray-300 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Join Lyfenote Today</CardTitle>
              <CardDescription className="text-gray-300 text-base">
                Start your free trial and experience the future of voice transcription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={isLogin ? "login" : "signup"} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 backdrop-blur-sm">
                  <TabsTrigger 
                    value="login" 
                    onClick={() => setIsLogin(true)}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    onClick={() => setIsLogin(false)}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white font-medium">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white font-medium">Password</Label>
                      <Input 
                        id="password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/10 border-white/20 text-white backdrop-blur-sm"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-semibold py-3"
                      disabled={loading}
                    >
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white font-medium">Full Name</Label>
                      <Input 
                        id="name" 
                        type="text" 
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-signup" className="text-white font-medium">Email</Label>
                      <Input 
                        id="email-signup" 
                        type="email" 
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signup" className="text-white font-medium">Password</Label>
                      <Input 
                        id="password-signup" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/10 border-white/20 text-white backdrop-blur-sm"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-semibold py-3"
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

        {/* Enhanced Testimonials */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-white mb-4">Loved by Users Worldwide</h2>
          <p className="text-gray-300 mb-12">See what our community has to say about Lyfenote</p>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic text-lg leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.author}</div>
                      <div className="text-purple-300 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center pb-20">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 rounded-3xl p-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Voice Notes?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied users who have revolutionised their productivity with Lyfenote
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
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
    </div>
  );
};

export default Index;

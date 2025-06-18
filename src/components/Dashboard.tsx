
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Upload, 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  Play, 
  Pause, 
  HelpCircle,
  Settings,
  LogOut,
  FileAudio,
  Calendar,
  Clock,
  Users,
  FileText,
  NotebookPen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      
      setUser(session.user);
      
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profileData);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  // Mock data for transcripts
  const transcripts = [
    {
      id: 1,
      title: "Team Meeting - Project Kickoff",
      date: "2024-01-15",
      duration: "45:30",
      status: "completed",
      preview: "Welcome everyone to the project kickoff meeting. Today we'll be discussing the roadmap..."
    },
    {
      id: 2,
      title: "Client Call - Requirements Review",
      date: "2024-01-14", 
      duration: "32:15",
      status: "completed",
      preview: "Thank you for joining the call. Let's go through the requirements document..."
    },
    {
      id: 3,
      title: "Brainstorming Session",
      date: "2024-01-13",
      duration: "28:45",
      status: "processing",
      preview: "AI transcription in progress..."
    }
  ];

  const handleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: "Your meeting is now being recorded.",
      });
    } else {
      setIsRecording(false);
      toast({
        title: "Recording Stopped", 
        description: "Processing your audio for transcription...",
      });
    }
  };

  const handleFileUpload = () => {
    toast({
      title: "File Upload",
      description: "File upload feature coming soon!",
    });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold gradient-text">Lyfe Personal Scribe</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || user.email}
              {profile?.role === 'super_admin' && (
                <Badge className="ml-2 bg-purple-600">Super Admin</Badge>
              )}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/notes")}>
              <NotebookPen className="h-4 w-4 mr-2" />
              My Notes
            </Button>
            {profile?.role === 'super_admin' && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Recording Controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mic className="h-5 w-5 mr-2 text-primary" />
                Record Meeting
              </CardTitle>
              <CardDescription>
                Start recording your meeting or conversation
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
              <Button
                onClick={handleRecording}
                size="lg"
                className={`rounded-full h-24 w-24 ${
                  isRecording 
                    ? "bg-red-600 hover:bg-red-700 recording-pulse" 
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                }`}
              >
                {isRecording ? <Pause className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-primary" />
                Upload Audio
              </CardTitle>
              <CardDescription>
                Upload MP3, WAV, or other audio files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <FileAudio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your audio file here
                </p>
                <Button onClick={handleFileUpload} variant="outline">
                  Choose File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card hover:glow-effect transition-all duration-300 cursor-pointer" onClick={() => navigate("/notes")}>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 text-primary" />
              <CardTitle>My Notes</CardTitle>
              <CardDescription>Create and manage your personal notes</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass-card hover:glow-effect transition-all duration-300 cursor-pointer">
            <CardHeader className="text-center">
              <FileAudio className="h-12 w-12 mx-auto mb-2 text-primary" />
              <CardTitle>Transcripts</CardTitle>
              <CardDescription>View and manage your transcribed meetings</CardDescription>
            </CardHeader>
          </Card>
          
          {profile?.role === 'super_admin' && (
            <Card className="glass-card hover:glow-effect transition-all duration-300 cursor-pointer" onClick={() => navigate("/admin")}>
              <CardHeader className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 text-primary" />
                <CardTitle>Admin Panel</CardTitle>
                <CardDescription>Manage users and system settings</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transcripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-white/20"
            />
          </div>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Filter by Date
          </Button>
        </div>

        {/* Transcripts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Your Transcripts</h2>
          {transcripts.map((transcript) => (
            <Card key={transcript.id} className="glass-card hover:glow-effect transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{transcript.title}</h3>
                      <Badge 
                        variant={transcript.status === "completed" ? "default" : "secondary"}
                        className={transcript.status === "completed" ? "bg-green-600" : "bg-yellow-600"}
                      >
                        {transcript.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {transcript.date}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {transcript.duration}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{transcript.preview}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

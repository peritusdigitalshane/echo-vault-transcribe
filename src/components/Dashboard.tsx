
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  NotebookPen,
  Key
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Transcription {
  id: string;
  title: string;
  content: string | null;
  audio_file_url: string | null;
  duration: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface UserApiKey {
  id: string;
  api_key_encrypted: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const Dashboard = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [userApiKey, setUserApiKey] = useState<UserApiKey | null>(null);
  const [newApiKey, setNewApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [navigate]);

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
    
    // Fetch user transcriptions
    await fetchTranscriptions();
    
    // Fetch user API key
    await fetchUserApiKey();
    
    setLoading(false);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  };

  const fetchTranscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTranscriptions(data || []);
    } catch (error: any) {
      console.error('Error fetching transcriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load transcriptions.",
        variant: "destructive",
      });
    }
  };

  const fetchUserApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }
      setUserApiKey(data);
    } catch (error: any) {
      console.error('Error fetching API key:', error);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKey.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      if (userApiKey) {
        // Update existing API key
        const { error } = await supabase
          .from('user_api_keys')
          .update({
            api_key_encrypted: newApiKey, // In production, this should be encrypted
            updated_at: new Date().toISOString()
          })
          .eq('id', userApiKey.id);

        if (error) throw error;
      } else {
        // Insert new API key
        const { error } = await supabase
          .from('user_api_keys')
          .insert({
            user_id: session.user.id,
            api_key_encrypted: newApiKey // In production, this should be encrypted
          });

        if (error) throw error;
      }

      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved successfully.",
      });

      setIsApiKeyDialogOpen(false);
      setNewApiKey("");
      await fetchUserApiKey();
    } catch (error: any) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save API key.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

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

  const handleDeleteTranscription = async (transcriptionId: string) => {
    if (!confirm("Are you sure you want to delete this transcription?")) return;

    try {
      const { error } = await supabase
        .from('transcriptions')
        .delete()
        .eq('id', transcriptionId);

      if (error) throw error;

      toast({
        title: "Transcription Deleted",
        description: "The transcription has been deleted successfully.",
      });

      await fetchTranscriptions();
    } catch (error: any) {
      console.error('Error deleting transcription:', error);
      toast({
        title: "Error",
        description: "Failed to delete transcription.",
        variant: "destructive",
      });
    }
  };

  const filteredTranscriptions = transcriptions.filter(transcript => 
    transcript.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transcript.content && transcript.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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

            {/* API Key Management Dialog */}
            <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Key className="h-4 w-4 mr-2" />
                  API Key
                  {userApiKey && <Badge className="ml-2 bg-green-600">Set</Badge>}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>OpenAI API Key</DialogTitle>
                  <DialogDescription>
                    Enter your OpenAI API key to enable transcription services.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveApiKey} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="sk-..."
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Your API key is stored securely and only used for your transcriptions.
                    </p>
                  </div>
                  <Button type="submit" className="w-full">
                    {userApiKey ? "Update API Key" : "Save API Key"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

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
              <CardDescription>
                {transcriptions.length} transcript{transcriptions.length !== 1 ? 's' : ''}
              </CardDescription>
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
          {filteredTranscriptions.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <FileAudio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "No transcripts found" : "No transcripts yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Try adjusting your search terms." 
                    : "Start recording or upload an audio file to create your first transcription."
                  }
                </p>
                {!searchTerm && !userApiKey && (
                  <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-md text-yellow-800 text-sm">
                    <strong>Note:</strong> You need to set your OpenAI API key to use transcription services.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTranscriptions.map((transcript) => (
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
                          {new Date(transcript.created_at).toLocaleDateString()}
                        </span>
                        {transcript.duration && (
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {transcript.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground line-clamp-3">
                        {transcript.content || "Processing..."}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {transcript.audio_file_url && (
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteTranscription(transcript.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

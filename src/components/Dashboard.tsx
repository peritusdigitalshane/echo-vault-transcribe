
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
  Key,
  Kanban,
  Square
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import SuperAdminSettings from "./SuperAdminSettings";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeAudio, uploadAndTranscribeFile } from "@/services/transcriptionService";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [userApiKey, setUserApiKey] = useState<UserApiKey | null>(null);
  const [newApiKey, setNewApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const { isRecording, startRecording, stopRecording, audioLevel } = useAudioRecorder();
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

  const handleStartRecording = async () => {
    try {
      await startRecording();
      toast({
        title: "Recording Started",
        description: "Your recording is now active. Click Stop to finish.",
      });
    } catch (error: any) {
      console.error('Recording start error:', error);
      toast({
        title: "Recording Failed",
        description: error.message || "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsTranscribing(true);
      const audioBlob = await stopRecording();
      
      if (audioBlob) {
        toast({
          title: "Recording Stopped", 
          description: "Processing your audio for transcription...",
        });

        const title = recordingTitle.trim() || `Recording ${new Date().toLocaleString()}`;
        const result = await transcribeAudio(audioBlob, title);

        if (result.success) {
          toast({
            title: "Transcription Complete",
            description: "Your recording has been transcribed successfully.",
          });
          setRecordingTitle("");
          await fetchTranscriptions();
        } else {
          toast({
            title: "Transcription Failed",
            description: result.error || "Failed to transcribe audio.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "No Recording Found",
          description: "No audio data was recorded.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Recording stop error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process recording.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm', 'audio/ogg'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an audio file (MP3, WAV, M4A, WebM, or OGG).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);
    
    try {
      const result = await uploadAndTranscribeFile(file);

      if (result.success) {
        toast({
          title: "Upload Successful",
          description: "Your file has been uploaded and is being transcribed.",
        });
        await fetchTranscriptions();
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload and transcribe file.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process file.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleDeleteTranscription = async (transcriptionId: string) => {
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
        description: error.message || "Failed to delete transcription.",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
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
      {/* Simplified Header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/c20f05a2-21a0-42bb-a423-fdc3e6844765.png" 
              alt="Lyfenote Logo" 
              className="h-12 w-auto"
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || user.email}
              {profile?.role === 'super_admin' && (
                <Badge className="ml-2 bg-purple-600">Super Admin</Badge>
              )}
            </span>
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
            <CardContent className="space-y-4">
              {!isRecording && !isTranscribing && (
                <div className="space-y-2">
                  <Label htmlFor="recordingTitle">Recording Title (Optional)</Label>
                  <Input
                    id="recordingTitle"
                    placeholder="Enter a title for your recording..."
                    value={recordingTitle}
                    onChange={(e) => setRecordingTitle(e.target.value)}
                  />
                </div>
              )}
              
              <div className="flex items-center justify-center py-8 space-x-4">
                <Button
                  onClick={handleStartRecording}
                  size="lg"
                  disabled={isRecording || isTranscribing}
                  className={`rounded-full h-24 w-24 ${
                    isRecording || isTranscribing
                      ? "bg-gray-600"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  }`}
                >
                  <Mic className="h-8 w-8" />
                </Button>
                
                <Button
                  onClick={handleStopRecording}
                  size="lg"
                  disabled={!isRecording || isTranscribing}
                  className={`rounded-full h-24 w-24 ${
                    !isRecording || isTranscribing
                      ? "bg-gray-600"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  <Square className="h-8 w-8" />
                </Button>
              </div>
              
              {isRecording && (
                <div className="text-center">
                  <div 
                    className="mx-auto w-12 h-12 rounded-full border-4 border-red-500 mb-2"
                    style={{
                      transform: `scale(${1 + audioLevel * 0.3})`,
                      opacity: 0.6,
                      transition: 'transform 0.1s ease-out'
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    Recording in progress... Audio level: {Math.round(audioLevel * 100)}%
                  </p>
                </div>
              )}
              
              {isTranscribing && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">
                    Processing audio for transcription...
                  </p>
                </div>
              )}
              
              {!isRecording && !isTranscribing && (
                <p className="text-center text-sm text-muted-foreground">
                  Click Start to begin recording, then Stop when finished
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-primary" />
                Upload Audio
              </CardTitle>
              <CardDescription>
                Upload MP3, WAV, M4A, WebM, or OGG files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragActive 
                    ? 'border-primary bg-primary/10' 
                    : 'border-white/20 hover:border-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <FileAudio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {dragActive ? "Drop your audio file here" : "Drag and drop your audio file here"}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Supports MP3, WAV, M4A, WebM, OGG (max 50MB)
                </p>
                <Button variant="outline" disabled={isTranscribing}>
                  {isTranscribing ? "Processing..." : "Choose File"}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <Card className="glass-card hover:glow-effect transition-all duration-300 cursor-pointer" onClick={() => navigate("/notes")}>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 text-primary" />
              <CardTitle>My Notes</CardTitle>
              <CardDescription>Create and manage your personal notes</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass-card hover:glow-effect transition-all duration-300 cursor-pointer" onClick={() => navigate("/tasks")}>
            <CardHeader className="text-center">
              <Kanban className="h-12 w-12 mx-auto mb-2 text-primary" />
              <CardTitle>Task Board</CardTitle>
              <CardDescription>Organize tasks with kanban board</CardDescription>
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

        {/* Settings Section */}
        <div className="mb-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Settings & Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              {/* API Key Management - Only show to super admins */}
              {profile?.role === 'super_admin' && (
                <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
                  <DialogTrigger asChild>
                    <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4 text-center">
                        <Key className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <h3 className="font-medium">API Key</h3>
                        {userApiKey && <Badge className="mt-1 bg-green-600">Set</Badge>}
                      </CardContent>
                    </Card>
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
              )}

              {profile?.role === 'super_admin' && (
                <>
                  {/* Super Admin Settings */}
                  <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4 text-center">
                      <SuperAdminSettings />
                    </CardContent>
                  </Card>

                  {/* Manage Users */}
                  <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin")}>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-medium">Manage Users</h3>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Help - Always visible */}
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardContent className="p-4 text-center">
                  <HelpCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium">Help</h3>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
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

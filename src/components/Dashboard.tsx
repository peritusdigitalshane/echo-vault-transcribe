import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Download, 
  Upload,
  FileAudio,
  RefreshCw,
  LogOut,
  Settings,
  FileText,
  Calendar,
  CheckSquare,
  Users,
  BarChart3,
  Clock,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import SuperAdminSettings from "./SuperAdminSettings";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loadingTranscriptions, setLoadingTranscriptions] = useState(false);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    duration,
    error: recordingError
  } = useAudioRecorder();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      setProfile(profileData);
      setLoading(false);
    };

    checkAuth();
    loadTranscriptions();
    loadRecordings();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadTranscriptions = async () => {
    setLoadingTranscriptions(true);
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTranscriptions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load transcriptions.",
        variant: "destructive",
      });
    } finally {
      setLoadingTranscriptions(false);
    }
  };

  const loadRecordings = async () => {
    setLoadingRecordings(true);
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecordings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load recordings.",
        variant: "destructive",
      });
    } finally {
      setLoadingRecordings(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, MP4, M4A, or WebM).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 25MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsUploadDialogOpen(true);
  };

  const handleUploadSubmit = async () => {
    if (!uploadedFile || !user) return;

    try {
      setUploadProgress(10);

      // Create form data
      const formData = new FormData();
      formData.append('audio', uploadedFile);

      setUploadProgress(30);

      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      setUploadProgress(50);

      // Call the transcribe function
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      setUploadProgress(80);

      if (error) throw error;

      setUploadProgress(100);

      toast({
        title: "Upload successful!",
        description: "Your audio file has been uploaded and transcription is being processed.",
      });

      setIsUploadDialogOpen(false);
      setUploadedFile(null);
      setUploadProgress(0);
      
      // Refresh transcriptions
      loadTranscriptions();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload audio file.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  };

  const handleRecordingUpload = async () => {
    if (!audioBlob || !user) return;

    try {
      // Create form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Call the transcribe function
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Recording uploaded!",
        description: "Your recording has been uploaded and transcription is being processed.",
      });
      
      // Refresh transcriptions
      loadTranscriptions();
    } catch (error: any) {
      console.error('Recording upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload recording.",
        variant: "destructive",
      });
    }
  };

  const handlePlayPause = (id: string, audioUrl: string) => {
    if (currentPlayingId === id) {
      // Pause current audio
      const audio = audioElements[id];
      if (audio) {
        audio.pause();
        setCurrentPlayingId(null);
      }
    } else {
      // Stop any currently playing audio
      Object.values(audioElements).forEach(audio => audio.pause());
      
      // Play new audio
      if (!audioElements[id]) {
        const audio = new Audio(audioUrl);
        audio.onended = () => setCurrentPlayingId(null);
        setAudioElements(prev => ({ ...prev, [id]: audio }));
        audio.play();
      } else {
        audioElements[id].play();
      }
      setCurrentPlayingId(id);
    }
  };

  const handleDelete = async (id: string, type: 'transcription' | 'recording') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const table = type === 'transcription' ? 'transcriptions' : 'recordings';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted successfully",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been deleted.`,
      });

      if (type === 'transcription') {
        loadTranscriptions();
      } else {
        loadRecordings();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete ${type}.`,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          title: newNoteTitle,
          content: newNoteContent,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Note created",
        description: "Your note has been created successfully.",
      });

      setIsNoteDialogOpen(false);
      setNewNoteTitle("");
      setNewNoteContent("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create note.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/c20f05a2-21a0-42bb-a423-fdc3e6844765.png" 
              alt="Lyfenote Logo" 
              className="h-12 w-auto"
            />
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
              {profile?.full_name || user?.email}
            </Badge>
            {profile?.role === 'super_admin' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
                <SuperAdminSettings />
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-300 hover:text-white">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Transcriptions</CardTitle>
              <FileText className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{transcriptions.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Recordings</CardTitle>
              <FileAudio className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{recordings.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {transcriptions.filter(t => 
                  new Date(t.created_at).getMonth() === new Date().getMonth()
                ).length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Success Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">98.5%</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Record Audio</CardTitle>
              <CardDescription className="text-gray-300">
                Start recording your voice or upload an audio file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex-1 ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                  {isRecording ? <Square className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
              </div>
              
              {isRecording && (
                <div className="text-center">
                  <div className="text-white font-mono text-lg">
                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-gray-400 text-sm">Recording in progress...</div>
                </div>
              )}
              
              {audioBlob && !isRecording && (
                <div className="space-y-2">
                  <audio controls className="w-full">
                    <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                  </audio>
                  <Button onClick={handleRecordingUpload} className="w-full bg-green-600 hover:bg-green-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Recording
                  </Button>
                </div>
              )}
              
              <div className="text-center text-gray-400">or</div>
              
              <div>
                <Label htmlFor="file-upload" className="text-white">Upload Audio File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="bg-white/10 border-white/20 text-white mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Quick Note</CardTitle>
              <CardDescription className="text-gray-300">
                Create a quick text note
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Note</DialogTitle>
                    <DialogDescription>
                      Add a quick note to your collection.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="note-title">Title</Label>
                      <Input
                        id="note-title"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        placeholder="Enter note title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="note-content">Content</Label>
                      <Textarea
                        id="note-content"
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Enter note content"
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleCreateNote} className="w-full">
                      Create Note
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Activity Overview</CardTitle>
              <CardDescription className="text-gray-300">
                Your recent activity summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Today</span>
                <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                  {transcriptions.filter(t => 
                    new Date(t.created_at).toDateString() === new Date().toDateString()
                  ).length} files
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">This Week</span>
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                  {transcriptions.filter(t => {
                    const transcriptionDate = new Date(t.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return transcriptionDate >= weekAgo;
                  }).length} files
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Average Time</span>
                <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                  2.5 min
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="transcriptions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 mb-6">
            <TabsTrigger value="transcriptions" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              My Transcriptions
            </TabsTrigger>
            <TabsTrigger value="recordings" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              My Recordings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcriptions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Transcriptions</h2>
              <Button 
                onClick={loadTranscriptions} 
                variant="outline" 
                size="sm"
                disabled={loadingTranscriptions}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingTranscriptions ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {loadingTranscriptions ? (
              <div className="text-center py-8 text-gray-300">Loading transcriptions...</div>
            ) : transcriptions.length === 0 ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No transcriptions yet</h3>
                  <p className="text-gray-300 mb-4">Upload your first audio file to get started with transcription.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {transcriptions.map((transcription) => (
                  <Card key={transcription.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{transcription.title}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${
                            transcription.status === 'completed' ? 'bg-green-600/20 text-green-400 border-green-500/30' :
                            transcription.status === 'processing' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30' :
                            'bg-red-600/20 text-red-400 border-red-500/30'
                          }`}>
                            {transcription.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transcription.id, 'transcription')}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-gray-300">
                        Created {new Date(transcription.created_at).toLocaleDateString()} • 
                        {transcription.duration && ` ${transcription.duration} • `}
                        {transcription.file_size && ` ${(transcription.file_size / (1024 * 1024)).toFixed(1)}MB`}
                      </CardDescription>
                    </CardHeader>
                    {transcription.content && (
                      <CardContent>
                        <div className="bg-black/20 rounded-lg p-4">
                          <p className="text-gray-200 whitespace-pre-wrap">{transcription.content}</p>
                        </div>
                        {transcription.audio_file_url && (
                          <div className="mt-4 flex items-center space-x-2">
                            <audio controls className="flex-1">
                              <source src={transcription.audio_file_url} type="audio/mpeg" />
                            </audio>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(transcription.audio_file_url, transcription.file_name || 'audio.mp3')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recordings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Recordings</h2>
              <Button 
                onClick={loadRecordings} 
                variant="outline" 
                size="sm"
                disabled={loadingRecordings}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingRecordings ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {loadingRecordings ? (
              <div className="text-center py-8 text-gray-300">Loading recordings...</div>
            ) : recordings.length === 0 ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="text-center py-8">
                  <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No recordings yet</h3>
                  <p className="text-gray-300 mb-4">Start recording to see your audio files here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {recordings.map((recording) => (
                  <Card key={recording.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{recording.title}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${
                            recording.status === 'completed' ? 'bg-green-600/20 text-green-400 border-green-500/30' :
                            recording.status === 'processing' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30' :
                            'bg-red-600/20 text-red-400 border-red-500/30'
                          }`}>
                            {recording.status}
                          </Badge>
                          {recording.audio_file_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePlayPause(recording.id, recording.audio_file_url)}
                            >
                              {currentPlayingId === recording.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(recording.id, 'recording')}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-gray-300">
                        Created {new Date(recording.created_at).toLocaleDateString()} • 
                        {recording.duration && ` ${recording.duration} • `}
                        {recording.file_size && ` ${(recording.file_size / (1024 * 1024)).toFixed(1)}MB`}
                      </CardDescription>
                    </CardHeader>
                    {recording.audio_file_url && (
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <audio controls className="flex-1">
                            <source src={recording.audio_file_url} type="audio/mpeg" />
                          </audio>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(recording.audio_file_url, recording.file_name || 'recording.mp3')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Audio File</DialogTitle>
              <DialogDescription>
                Your file "{uploadedFile?.name}" is ready to upload.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUploadSubmit} disabled={uploadProgress > 0}>
                  {uploadProgress > 0 ? 'Uploading...' : 'Upload & Transcribe'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;

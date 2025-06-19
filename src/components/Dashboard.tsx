import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  FileAudio, 
  Mic, 
  Upload, 
  Settings, 
  Download,
  Play,
  Pause,
  Trash2,
  Calendar,
  Users,
  Clock,
  BarChart3,
  PlusCircle,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeAudio, uploadAndTranscribeFile } from "@/services/transcriptionService";
import { RecordingStorageService } from "@/services/recordingStorageService";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    isRecording,
    startRecording,
    stopRecording,
    audioLevel
  } = useAudioRecorder();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
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
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    };

    const initAuth = async () => {
      await initializeAuth();
      await loadTranscriptions();
      await loadRecordings();
      await loadTasks();
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    // Initialize auth
    initAuth();

    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadTranscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select(`
          *,
          transcription_tags (
            tags (
              id,
              name,
              color
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transcriptionsWithTags = data?.map(transcript => ({
        ...transcript,
        tags: transcript.transcription_tags?.map(tt => tt.tags).filter(Boolean) || []
      })) || [];

      setTranscriptions(transcriptionsWithTags);
    } catch (error: any) {
      console.error('Error loading transcriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load transcriptions",
        variant: "destructive",
      });
    }
  };

  const loadRecordings = async () => {
    try {
      const recordings = await RecordingStorageService.getRecordings();
      setRecordings(recordings);
    } catch (error: any) {
      console.error('Error loading recordings:', error);
      toast({
        title: "Error",
        description: "Failed to load recordings",
        variant: "destructive",
      });
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
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
    const success = await startRecording();
    if (success) {
      toast({
        title: "Recording Started",
        description: "Voice note recording has begun.",
      });
    } else {
      toast({
        title: "Recording Failed",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    setIsTranscribing(true);
    
    try {
      const audioBlob = await stopRecording();
      
      if (audioBlob) {
        toast({
          title: "Recording Stopped",
          description: "Processing voice note for transcription...",
        });

        const result = await transcribeAudio(audioBlob, `Voice Note ${new Date().toLocaleString()}`);

        if (result.success) {
          toast({
            title: "Voice Note Transcribed",
            description: "Your voice note has been transcribed successfully.",
          });
          
          await loadTranscriptions(); // Reload to show new transcription
        } else {
          toast({
            title: "Transcription Failed",
            description: result.error || "Failed to transcribe voice note.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "No Audio Found",
          description: "No audio data was recorded.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Recording error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process recording.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm', 'audio/ogg'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an audio file (MP3, WAV, M4A, WebM, or OGG).",
        variant: "destructive",
      });
      return;
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsTranscribing(true);

    try {
      toast({
        title: "Upload Started",
        description: "Uploading and transcribing your audio file...",
      });

      const result = await uploadAndTranscribeFile(file);

      if (result.success) {
        toast({
          title: "File Transcribed",
          description: "Your audio file has been transcribed successfully.",
        });
        
        await loadTranscriptions(); // Reload to show new transcription
      } else {
        toast({
          title: "Transcription Failed",
          description: result.error || "Failed to transcribe audio file.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload and transcribe file.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
      setSelectedFile(null);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Calculate metrics
  const thisMonthTranscriptions = transcriptions.filter(t => {
    const created = new Date(t.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const successRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold gradient-text">Lyfenote Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || user.email}
              {profile?.role === 'super_admin' && (
                <Badge className="ml-2 bg-purple-600">Super Admin</Badge>
              )}
            </span>
            {profile?.role === 'super_admin' && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                <Settings className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/tasks")}>
              <Calendar className="h-4 w-4 mr-2" />
              Tasks
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/notes")}>
              <FileAudio className="h-4 w-4 mr-2" />
              Notes
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <FileAudio className="h-4 w-4 mr-2" />
                Total Transcriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transcriptions.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Mic className="h-4 w-4 mr-2" />
                Recordings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recordings.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisMonthTranscriptions}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Record Audio */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                Record Audio
              </CardTitle>
              <p className="text-sm text-muted-foreground">Start recording your voice or upload an audio file</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-4">
                {!isRecording && !isTranscribing ? (
                  <Button
                    onClick={handleStartRecording}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-full"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopRecording}
                    disabled={isTranscribing}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-full"
                  >
                    {isTranscribing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Pause className="h-5 w-5 mr-2" />
                        Stop Recording
                      </>
                    )}
                  </Button>
                )}
              </div>

              {isRecording && (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-red-600">Recording...</span>
                  </div>
                  {audioLevel > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-150" 
                        style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">or</div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload Audio File</p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  disabled={isTranscribing}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload">
                  <Button
                    variant="outline"
                    disabled={isTranscribing}
                    className="cursor-pointer"
                    asChild
                  >
                    <span>Choose file</span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Quick Note */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Quick Note</CardTitle>
              <p className="text-sm text-muted-foreground">Create a quick text note</p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/notes")}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Note
              </Button>
            </CardContent>
          </Card>

          {/* Activity Overview */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <p className="text-sm text-muted-foreground">Your recent activity summary</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Today</span>
                <Badge variant="outline">{transcriptions.filter(t => new Date(t.created_at).toDateString() === new Date().toDateString()).length} files</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">This Week</span>
                <Badge variant="outline">{transcriptions.filter(t => {
                  const created = new Date(t.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return created >= weekAgo;
                }).length} files</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Tasks Completed</span>
                <Badge variant="outline">{completedTasks}/{totalTasks}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => navigate("/notes")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4"
          >
            My Transcriptions
          </Button>
          <Button 
            onClick={() => navigate("/tasks")}
            variant="outline" 
            className="border-white/20 hover:bg-background/50 py-4"
          >
            My Tasks & Calendar
          </Button>
        </div>

        {/* Tasks Section */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/tasks")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No tasks yet. Start by creating your first task.
              </p>
            ) : (
              <div className="space-y-4">
                {tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{task.title}</h3>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {task.due_date && (
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transcriptions List */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transcriptions</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={loadTranscriptions}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {transcriptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transcriptions yet. Start by recording a voice note or uploading an audio file.
              </p>
            ) : (
              <div className="space-y-4">
                {transcriptions.slice(0, 5).map((transcript) => (
                  <div key={transcript.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{transcript.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={transcript.status === 'completed' ? 'default' : 'secondary'}>
                          {transcript.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(transcript.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {transcript.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {transcript.content}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(transcript.created_at).toLocaleString()}
                      {transcript.duration && <span> • Duration: {transcript.duration}</span>}
                    </div>
                    {transcript.tags && transcript.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {transcript.tags.map((tag: any) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: tag.color, color: tag.color }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {transcriptions.length > 5 && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/notes")}
                    >
                      View All Transcriptions
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

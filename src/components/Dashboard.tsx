
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeAudio, uploadAndTranscribeFile } from "@/services/transcriptionService";
import { RecordingStorageService } from "@/services/recordingStorageService";
import RecordingPlayer from "@/components/RecordingPlayer";
import RecordingScheduler from "@/components/RecordingScheduler";
import MeetingRecorder from "@/components/MeetingRecorder";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("voice-notes");
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

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!session) {
          navigate("/");
        } else {
          setUser(session.user);
        }
      });

      return subscription;
    };

    let authSubscription: any;
    
    const init = async () => {
      authSubscription = await initializeAuth();
    };
    
    init();
    loadTranscriptions();
    loadRecordings();

    // Cleanup function
    return () => {
      if (authSubscription && typeof authSubscription.unsubscribe === 'function') {
        authSubscription.unsubscribe();
      }
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

  const handleDeleteRecording = async (recordingId: string) => {
    try {
      const success = await RecordingStorageService.deleteRecording(recordingId);
      if (success) {
        toast({
          title: "Recording Deleted",
          description: "The recording has been successfully deleted.",
        });
        await loadRecordings(); // Reload recordings list
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete the recording.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the recording.",
        variant: "destructive",
      });
    }
  };

  const handleMeetingRecordingComplete = async (result: any) => {
    if (result.success) {
      await loadTranscriptions();
      await loadRecordings();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold gradient-text">Lyfe Dashboard</h1>
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
                Admin
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
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="voice-notes">Voice Notes</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
            <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          </TabsList>

          {/* Voice Notes Tab */}
          <TabsContent value="voice-notes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recording Controls */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mic className="h-5 w-5 mr-2 text-primary" />
                    Voice Recording
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    {!isRecording && !isTranscribing ? (
                      <Button
                        onClick={handleStartRecording}
                        size="lg"
                        className="rounded-full h-20 w-20 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                      >
                        <Mic className="h-8 w-8" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStopRecording}
                        size="lg"
                        disabled={isTranscribing}
                        className="rounded-full h-20 w-20 bg-gray-600 hover:bg-gray-700"
                      >
                        {isTranscribing ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        ) : (
                          <Pause className="h-8 w-8" />
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

                  {isTranscribing && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Processing audio for transcription...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-primary" />
                    Upload Audio File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-4">
                      Upload audio files (MP3, WAV, M4A, WebM, OGG)
                    </p>
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
                        <span>
                          {isTranscribing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose File
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-center">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Transcriptions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Transcriptions</CardTitle>
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
                          <Badge variant={transcript.status === 'completed' ? 'default' : 'secondary'}>
                            {transcript.status}
                          </Badge>
                        </div>
                        {transcript.content && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {transcript.content}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{new Date(transcript.created_at).toLocaleString()}</span>
                          {transcript.duration && <span>Duration: {transcript.duration}</span>}
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="space-y-6">
            <MeetingRecorder onRecordingComplete={handleMeetingRecordingComplete} />
          </TabsContent>

          {/* Recordings Tab */}
          <TabsContent value="recordings" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <FileAudio className="h-5 w-5 mr-2 text-primary" />
                    My Recordings
                  </span>
                  <Badge variant="outline">{recordings.length} recordings</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recordings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No recordings yet. Start recording meetings or voice notes to see them here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recordings.map((recording) => (
                      <div key={recording.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{recording.title}</h3>
                              <Badge variant="outline">
                                {recording.recording_type.replace('_', ' ')}
                              </Badge>
                              {recording.consent_given && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  <Users className="h-3 w-3 mr-1" />
                                  Consent Given
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(recording.created_at).toLocaleString()}
                              </span>
                              {recording.duration && (
                                <span>Duration: {recording.duration}</span>
                              )}
                              {recording.file_size && (
                                <span>Size: {(recording.file_size / 1024 / 1024).toFixed(1)} MB</span>
                              )}
                            </div>
                            {recording.participants && recording.participants.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                Participants: {recording.participants.join(', ')}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRecording(recording.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {recording.audio_file_url && (
                          <RecordingPlayer
                            audioUrl={recording.audio_file_url}
                            title={recording.title}
                            duration={recording.duration}
                            recordingType={recording.recording_type}
                          />
                        )}

                        {recording.tags && recording.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {recording.tags.map((tag: any) => (
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduler Tab */}
          <TabsContent value="scheduler" className="space-y-6">
            <RecordingScheduler />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;

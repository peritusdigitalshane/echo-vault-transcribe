import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  LogOut, 
  FileAudio,
  Video,
  Upload,
  BarChart3,
  Clock,
  FileText,
  Users,
  Settings,
  CheckSquare,
  StickyNote,
  HelpCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AudioRecorder from "./AudioRecorder";
import MeetingRecorder from "./MeetingRecorder";
import { uploadAndTranscribeFile } from "@/services/transcriptionService";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showMeetingRecorder, setShowMeetingRecorder] = useState(false);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadAndTranscribeFile(file);
      if (result.success) {
        toast({
          title: "File Uploaded & Transcribed",
          description: "Your file has been successfully uploaded and transcribed.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("File upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload and transcribe file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setFile(null);
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
          <div>
            <h1 className="text-2xl font-bold gradient-text">Lyfe AI</h1>
            <p className="text-sm text-muted-foreground">
              Welcome to your AI-powered life assistant
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || user.email}
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

      <main className="container mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Record Notes Button */}
            <Card className="glass-card hover:glow-effect transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Button
                  onClick={() => setShowRecorder(true)}
                  variant="ghost"
                  className="w-full h-full flex flex-col items-center space-y-2 p-4"
                >
                  <FileAudio className="h-8 w-8 text-primary" />
                  <span className="font-medium">Record Notes</span>
                  <span className="text-sm text-muted-foreground">Voice to text notes</span>
                </Button>
              </CardContent>
            </Card>

            {/* Record Meeting Button */}
            <Card className="glass-card hover:glow-effect transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Button
                  onClick={() => setShowMeetingRecorder(true)}
                  variant="ghost"
                  className="w-full h-full flex flex-col items-center space-y-2 p-4"
                >
                  <Video className="h-8 w-8 text-primary" />
                  <span className="font-medium">Record Meeting</span>
                  <span className="text-sm text-muted-foreground">Capture meeting audio</span>
                </Button>
              </CardContent>
            </Card>

            {/* Upload File Button */}
            <Card className="glass-card hover:glow-effect transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center">
                <label htmlFor="upload-file" className="w-full h-full flex flex-col items-center space-y-2 p-4 cursor-pointer">
                  <Upload className="h-8 w-8 text-primary" />
                  <span className="font-medium">Upload File</span>
                  <span className="text-sm text-muted-foreground">Transcribe audio from file</span>
                </label>
                <Input
                  type="file"
                  id="upload-file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </CardContent>
            </Card>

            {/* Tasks Button */}
            <Card className="glass-card hover:glow-effect transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Button
                  onClick={() => navigate("/tasks")}
                  variant="ghost"
                  className="w-full h-full flex flex-col items-center space-y-2 p-4"
                >
                  <CheckSquare className="h-8 w-8 text-primary" />
                  <span className="font-medium">Tasks</span>
                  <span className="text-sm text-muted-foreground">Manage your tasks</span>
                </Button>
              </CardContent>
            </Card>

            {/* Notes Button */}
            <Card className="glass-card hover:glow-effect transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Button
                  onClick={() => navigate("/notes")}
                  variant="ghost"
                  className="w-full h-full flex flex-col items-center space-y-2 p-4"
                >
                  <StickyNote className="h-8 w-8 text-primary" />
                  <span className="font-medium">Notes</span>
                  <span className="text-sm text-muted-foreground">Create and manage notes</span>
                </Button>
              </CardContent>
            </Card>

            {/* Help Center Button */}
            <Card className="glass-card hover:glow-effect transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Button
                  onClick={() => navigate("/help")}
                  variant="ghost"
                  className="w-full h-full flex flex-col items-center space-y-2 p-4"
                >
                  <HelpCircle className="h-8 w-8 text-primary" />
                  <span className="font-medium">Help Center</span>
                  <span className="text-sm text-muted-foreground">Get assistance and support</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Statistics Overview */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Statistics Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Total Transcriptions</CardTitle>
                <CardDescription>Number of transcriptions generated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">42</div>
                <BarChart3 className="h-4 w-4 text-muted-foreground mt-2" />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Average Transcription Time</CardTitle>
                <CardDescription>Average time taken for transcriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">3m 15s</div>
                <Clock className="h-4 w-4 text-muted-foreground mt-2" />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Total Active Users</CardTitle>
                <CardDescription>Number of users actively using the app</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">28</div>
                <Users className="h-4 w-4 text-muted-foreground mt-2" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Latest Transcriptions</CardTitle>
              <CardDescription>Your most recent transcription activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-none space-y-2">
                <li className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Meeting Notes - Project Kickoff</span>
                  </div>
                  <span className="text-sm text-muted-foreground">5 minutes ago</span>
                </li>
                <li className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Quick Ideas - Brainstorming Session</span>
                  </div>
                  <span className="text-sm text-muted-foreground">12 minutes ago</span>
                </li>
                <li className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Lecture Notes - Quantum Physics</span>
                  </div>
                  <span className="text-sm text-muted-foreground">30 minutes ago</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Audio Recorder Dialog */}
        <Dialog open={showRecorder} onOpenChange={setShowRecorder}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Notes</DialogTitle>
              <DialogDescription>
                Record your voice notes and convert them to text automatically.
              </DialogDescription>
            </DialogHeader>
            <AudioRecorder onClose={() => setShowRecorder(false)} />
          </DialogContent>
        </Dialog>

        {/* Meeting Recorder Dialog */}
        <Dialog open={showMeetingRecorder} onOpenChange={setShowMeetingRecorder}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Meeting</DialogTitle>
              <DialogDescription>
                Record and transcribe meeting audio from video conferences.
              </DialogDescription>
            </DialogHeader>
            <MeetingRecorder onClose={() => setShowMeetingRecorder(false)} />
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <Dialog open={uploading} onOpenChange={setUploading}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Audio File</DialogTitle>
              <DialogDescription>
                Upload an audio file to transcribe.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input type="file" onChange={handleFileChange} />
            </div>
            <Button onClick={handleUpload} disabled={!file}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Dashboard;

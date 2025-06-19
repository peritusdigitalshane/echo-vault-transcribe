
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  FileAudio, 
  Mic, 
  Upload,
  Settings,
  BookOpen,
  CheckSquare,
  HelpCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SuperAdminSettings from "./SuperAdminSettings";
import EnhancedMeetingRecorder from "./EnhancedMeetingRecorder";
import HelpCenter from "./HelpCenter";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("meetings");
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

  const handleRecordingComplete = () => {
    toast({
      title: "Recording Complete",
      description: "Your recording has been processed successfully.",
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileAudio className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold gradient-text">Lyfe</h1>
            </div>
            <Badge variant="secondary">Audio Transcription</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || user.email}
              {profile?.role === 'super_admin' && (
                <Badge className="ml-2 bg-purple-600">Super Admin</Badge>
              )}
            </span>
            {profile?.role === 'super_admin' && <SuperAdminSettings />}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="meetings" className="flex items-center space-x-2">
                <FileAudio className="h-4 w-4" />
                <span>Meetings</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>History</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Notes</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center space-x-2">
                <CheckSquare className="h-4 w-4" />
                <span>Tasks</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="meetings" className="space-y-6">
              <EnhancedMeetingRecorder 
                onRecordingComplete={handleRecordingComplete}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div className="text-center py-12">
                <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Recording History</h3>
                <p className="text-muted-foreground mb-4">
                  View and manage your recording history and transcriptions.
                </p>
                <p className="text-sm text-muted-foreground">
                  History feature will be available soon.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Notes Feature</h3>
                <p className="text-muted-foreground mb-4">
                  Take and organize your notes from transcriptions and meetings.
                </p>
                <Button onClick={() => navigate("/notes")}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Go to Notes
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <div className="text-center py-12">
                <CheckSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Task Management</h3>
                <p className="text-muted-foreground mb-4">
                  Create and manage tasks from your transcriptions and meetings.
                </p>
                <Button onClick={() => navigate("/tasks")}>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Go to Tasks
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Help Center Floating Button */}
        <div className="fixed bottom-6 right-6">
          <HelpCenter />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

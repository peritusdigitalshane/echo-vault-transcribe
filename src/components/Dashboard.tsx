
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  FileText, 
  Clock, 
  Calendar,
  Plus,
  Upload,
  Search,
  Filter,
  Users,
  Settings,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminSettings from "./SuperAdminSettings";

const Dashboard = () => {
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [userRole, setUserRole] = useState<string>('customer');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/");
          return;
        }

        setUser(session.user);

        // Get user profile with role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserRole(profile.role || 'customer');
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    const loadTranscriptions = async () => {
      try {
        const { data, error } = await supabase
          .from('transcriptions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setTranscriptions(data || []);
      } catch (error: any) {
        console.error('Error loading transcriptions:', error);
      }
    };

    const loadTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setTasks(data || []);
      } catch (error: any) {
        console.error('Error loading tasks:', error);
      }
    };

    const initAuth = async () => {
      await initializeAuth();
      await loadTranscriptions();
      await loadTasks();
    };

    initAuth();

    // Set up auth state listener
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    // Cleanup function
    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Mic className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-white font-semibold">Lyfenote</span>
            </div>
            <h1 className="text-2xl font-bold text-white ml-8">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-purple-600 text-white px-3 py-1 rounded-full">
              {user?.email?.split('@')[0]} (Super Admin)
            </Badge>
            {userRole === 'super_admin' && (
              <>
                <SuperAdminSettings />
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => navigate("/admin")}>
                  <Users className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Transcriptions</CardTitle>
              <FileText className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{transcriptions.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Recordings</CardTitle>
              <Mic className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {transcriptions.filter(t => 
                  new Date(t.created_at).getMonth() === new Date().getMonth()
                ).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Success Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">98.5%</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Record Audio */}
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-white">Record Audio</CardTitle>
              <CardDescription className="text-white/60">
                Start recording your voice or upload an audio file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate("/")} 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
              <div className="text-center text-white/60">or</div>
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio File
              </Button>
            </CardContent>
          </Card>

          {/* Quick Note */}
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-white">Quick Note</CardTitle>
              <CardDescription className="text-white/60">
                Create a quick text note
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/notes")} 
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </CardContent>
          </Card>

          {/* Activity Overview */}
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-white">Activity Overview</CardTitle>
              <CardDescription className="text-white/60">
                Your recent activity summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Today</span>
                <span className="text-green-400">1 files</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">This Week</span>
                <span className="text-blue-400">6 files</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Average Time</span>
                <span className="text-purple-400">2.5 min</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button 
            onClick={() => navigate("/transcriptions")} 
            className="h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            My Transcriptions
          </Button>
          
          <Button 
            variant="outline" 
            className="h-16 border-white/20 text-white hover:bg-white/10"
          >
            My Recordings
          </Button>
        </div>

        {/* Transcriptions List */}
        <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Transcriptions</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {transcriptions.length === 0 ? (
              <div className="text-center py-12">
                <Mic className="h-12 w-12 mx-auto text-white/40 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">No transcriptions yet</h3>
                <p className="text-white/60 mb-4">
                  Start recording to create your first transcription
                </p>
                <Button onClick={() => navigate("/")}>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {transcriptions.map((transcription) => (
                  <div 
                    key={transcription.id} 
                    className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => navigate(`/transcription/${transcription.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium line-clamp-1 text-white">
                        {transcription.title || `Meeting Recording ${new Date(transcription.created_at).toLocaleDateString()}`}
                      </h3>
                      <Badge 
                        variant={transcription.status === 'completed' ? 'default' : 'secondary'}
                        className={transcription.status === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}
                      >
                        {transcription.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/60 mb-2">
                      Created {new Date(transcription.created_at).toLocaleDateString()} • 0.0MB
                    </p>
                    <p className="text-sm text-white/80">
                      Subs by www.zeoranger.co.uk
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

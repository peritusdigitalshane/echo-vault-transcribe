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
  Settings
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

  const handleStartRecording = () => {
    setIsRecording(true);
    toast({
      title: "Recording Started",
      description: "The recording has started.",
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast({
      title: "Recording Stopped",
      description: "The recording has stopped.",
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              {userRole === 'super_admin' ? 'Super Admin' : 'Customer'}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            {userRole === 'super_admin' && (
              <>
                <SuperAdminSettings />
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transcriptions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transcriptions.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasks.filter(task => task.status !== 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recording Status</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isRecording ? "Active" : "Idle"}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transcriptions.filter(t => 
                  new Date(t.created_at).getMonth() === new Date().getMonth()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button 
            onClick={() => navigate("/")} 
            className="h-24 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Mic className="h-6 w-6 mr-3" />
            Start Recording
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate("/notes")} 
            className="h-24 border-2 hover:bg-purple-50"
          >
            <FileText className="h-6 w-6 mr-3" />
            View Notes
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate("/tasks")} 
            className="h-24 border-2 hover:bg-blue-50"
          >
            <Calendar className="h-6 w-6 mr-3" />
            Manage Tasks
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
              onClick={() => navigate("/")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Recording
            </Button>
          </CardHeader>
          <CardContent>
            {transcriptions.length === 0 ? (
              <div className="text-center py-12">
                <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No transcriptions yet</h3>
                <p className="text-muted-foreground mb-4">
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
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/transcription/${transcription.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium line-clamp-1">
                        {transcription.title || "Untitled Transcription"}
                      </h3>
                      <Badge variant={transcription.status === 'completed' ? 'default' : 'secondary'}>
                        {transcription.status}
                      </Badge>
                    </div>
                    {transcription.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {transcription.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {new Date(transcription.created_at).toLocaleDateString()}
                      </span>
                      {transcription.duration && (
                        <span>{Math.round(transcription.duration / 60)} min</span>
                      )}
                    </div>
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

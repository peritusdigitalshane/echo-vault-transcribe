
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  Settings, 
  HelpCircle, 
  Users, 
  NotebookPen, 
  FileAudio,
  Key
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SuperAdminSettings from "@/components/SuperAdminSettings";
import KanbanBoard from "@/components/KanbanBoard";

const Tasks = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <FileAudio className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/notes")}>
              <NotebookPen className="h-4 w-4 mr-2" />
              My Notes
            </Button>
            {profile?.role === 'super_admin' && (
              <>
                <SuperAdminSettings />
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </>
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

      <KanbanBoard />
    </div>
  );
};

export default Tasks;

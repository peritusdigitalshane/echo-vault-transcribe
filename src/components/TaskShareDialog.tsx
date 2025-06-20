
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Share2, X, UserPlus } from "lucide-react";

interface TaskShare {
  id: string;
  shared_with: string;
  permission_level: 'viewer' | 'editor';
  profiles: {
    email: string;
    full_name: string;
  };
}

interface TaskShareDialogProps {
  taskId: string;
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const TaskShareDialog = ({ taskId, taskTitle, isOpen, onClose }: TaskShareDialogProps) => {
  const [email, setEmail] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'viewer' | 'editor'>('viewer');
  const [shares, setShares] = useState<TaskShare[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchShares = async () => {
    try {
      // Using any to bypass type checking since task_shares isn't in generated types yet
      const { data, error } = await (supabase as any)
        .from('task_shares')
        .select(`
          id,
          shared_with,
          permission_level,
          profiles!task_shares_shared_with_fkey (
            email,
            full_name
          )
        `)
        .eq('task_id', taskId);

      if (error) throw error;
      setShares(data || []);
    } catch (error: any) {
      console.error('Error fetching shares:', error);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .single();

      if (userError || !userData) {
        toast({
          title: "User not found",
          description: "No user found with that email address.",
          variant: "destructive",
        });
        return;
      }

      // Create the share using any to bypass type checking
      const { error: shareError } = await (supabase as any)
        .from('task_shares')
        .insert({
          task_id: taskId,
          shared_with: userData.id,
          permission_level: permissionLevel
        });

      if (shareError) {
        if (shareError.code === '23505') {
          toast({
            title: "Already shared",
            description: "This task is already shared with that user.",
            variant: "destructive",
          });
        } else {
          throw shareError;
        }
        return;
      }

      toast({
        title: "Task shared",
        description: `Task shared with ${email} as ${permissionLevel}.`,
      });

      setEmail('');
      setPermissionLevel('viewer');
      await fetchShares();
    } catch (error: any) {
      console.error('Error sharing task:', error);
      toast({
        title: "Error",
        description: "Failed to share task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async (shareId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('task_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Share removed",
        description: "Task sharing has been removed.",
      });

      await fetchShares();
    } catch (error: any) {
      console.error('Error removing share:', error);
      toast({
        title: "Error",
        description: "Failed to remove share. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: 'viewer' | 'editor') => {
    try {
      const { error } = await (supabase as any)
        .from('task_shares')
        .update({ permission_level: newPermission })
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Permission updated",
        description: `Permission level updated to ${newPermission}.`,
      });

      await fetchShares();
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch shares when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchShares();
    }
  }, [isOpen, taskId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Task</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share "{taskTitle}" with others via their email address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Form */}
          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-white/20"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission">Permission Level</Label>
              <Select value={permissionLevel} onValueChange={(value: 'viewer' | 'editor') => setPermissionLevel(value)}>
                <SelectTrigger className="bg-background/50 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Can view only</SelectItem>
                  <SelectItem value="editor">Editor - Can view and edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              disabled={loading || !email.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {loading ? 'Sharing...' : 'Share Task'}
            </Button>
          </form>

          {/* Current Shares */}
          {shares.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Currently Shared With:</h4>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-white/10">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {share.profiles.full_name || share.profiles.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{share.profiles.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={share.permission_level}
                        onValueChange={(value: 'viewer' | 'editor') => handleUpdatePermission(share.id, value)}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnshare(share.id)}
                        className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskShareDialog;

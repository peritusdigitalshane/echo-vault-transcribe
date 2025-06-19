
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, Trash2, Clock, CheckCircle, Archive, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  position: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  notes?: string;
}

const KanbanBoard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      
      const typedTasks = (data || []).map(task => ({
        ...task,
        status: task.status as TaskStatus
      }));
      
      setTasks(typedTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          user_id: session.user.id,
          position: tasks.length
        });

      if (error) throw error;

      toast({
        title: "Task Created",
        description: "Your task has been created successfully.",
      });

      setNewTask({ title: '', description: '', status: 'todo' });
      setIsDialogOpen(false);
      await fetchTasks();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create task.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Task Deleted",
        description: "The task has been deleted successfully.",
      });

      await fetchTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete task.",
        variant: "destructive",
      });
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    await handleUpdateTask(taskId, { status: newStatus });
  };

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return {
          title: 'To Do',
          icon: Circle,
          color: 'text-blue-400',
          count: tasks.filter(t => t.status === 'todo').length
        };
      case 'in_progress':
        return {
          title: 'In Progress',
          icon: Clock,
          color: 'text-yellow-400',
          count: tasks.filter(t => t.status === 'in_progress').length
        };
      case 'completed':
        return {
          title: 'Completed',
          icon: CheckCircle,
          color: 'text-green-400',
          count: tasks.filter(t => t.status === 'completed').length
        };
      case 'archived':
        return {
          title: 'Archived',
          icon: Archive,
          color: 'text-purple-400',
          count: tasks.filter(t => t.status === 'archived').length
        };
      default:
        return {
          title: 'Unknown',
          icon: Circle,
          color: 'text-gray-400',
          count: 0
        };
    }
  };

  const filterTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const columns: TaskStatus[] = ['todo', 'in_progress', 'completed', 'archived'];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Lyfe Tasks</h1>
          <p className="text-muted-foreground">Organize your work and life with a modern task board</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg glow-effect">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/20">
            <DialogHeader>
              <DialogTitle className="gradient-text">Create New Task</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new task to your board and get things done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="bg-background/50 border-white/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add more details..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="bg-background/50 border-white/20"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                  className="w-full p-3 bg-background/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Create Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((status) => {
          const config = getStatusConfig(status);
          const statusTasks = filterTasksByStatus(status);
          const StatusIcon = config.icon;
          
          return (
            <div key={status} className="space-y-4">
              {/* Column Header */}
              <Card className="glass-card hover:glow-effect transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`h-5 w-5 ${config.color}`} />
                      <span className="font-semibold text-foreground">{config.title}</span>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {config.count}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Tasks */}
              <div className="space-y-3 min-h-[400px]">
                {statusTasks.map((task) => (
                  <Card key={task.id} className="glass-card hover:glow-effect transition-all duration-300 group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-foreground text-sm leading-tight flex-1 mr-2">
                          {task.title}
                        </h3>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-blue-500/20 hover:text-blue-400"
                            onClick={() => setEditingTask(task)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-400"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(task.created_at)}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {columns
                            .filter(col => col !== status)
                            .slice(0, 2)
                            .map((targetStatus) => {
                              const targetConfig = getStatusConfig(targetStatus);
                              return (
                                <Button
                                  key={targetStatus}
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs px-2 py-1 border-white/20 bg-background/30 hover:bg-primary/20 hover:border-primary/30 hover:text-primary"
                                  onClick={() => moveTask(task.id, targetStatus)}
                                >
                                  → {targetConfig.title}
                                </Button>
                              );
                            })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {statusTasks.length === 0 && (
                  <Card className="glass-card border-dashed border-white/10">
                    <CardContent className="p-8 text-center">
                      <StatusIcon className={`h-12 w-12 mx-auto mb-3 ${config.color} opacity-30`} />
                      <p className="text-muted-foreground text-sm font-medium mb-1">No tasks yet</p>
                      <p className="text-muted-foreground/60 text-xs">
                        {status === 'todo' ? 'Add your first task to get started' : `No tasks ${config.title.toLowerCase()}`}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="glass-card border-white/20">
            <DialogHeader>
              <DialogTitle className="gradient-text">Edit Task</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Update your task details and track your progress.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleUpdateTask(editingTask.id, {
                  title: editingTask.title,
                  description: editingTask.description,
                  status: editingTask.status
                });
                setEditingTask(null);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="bg-background/50 border-white/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="bg-background/50 border-white/20"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                  className="w-full p-3 bg-background/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  Update Task
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingTask(null)} className="border-white/20 hover:bg-background/50">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default KanbanBoard;


import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit3, Trash2, Clock, CheckCircle, Archive, Circle, Calendar, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  scheduled_at?: string;
}

const KanbanBoard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    scheduled_at: undefined as Date | undefined
  });
  const [activeView, setActiveView] = useState<'kanban' | 'calendar'>('kanban');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
          position: tasks.length,
          scheduled_at: newTask.scheduled_at?.toISOString()
        });

      if (error) throw error;

      toast({
        title: "Task Created",
        description: "Your task has been created successfully.",
      });

      setNewTask({ title: '', description: '', status: 'todo', scheduled_at: undefined });
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
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Handle scheduled_at properly
      if (updates.scheduled_at !== undefined) {
        updateData.scheduled_at = updates.scheduled_at;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
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

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.scheduled_at) return false;
      const taskDate = new Date(task.scheduled_at);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const columns: TaskStatus[] = ['todo', 'in_progress', 'completed', 'archived'];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <div className="flex items-center space-x-4">
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'kanban' | 'calendar')}>
            <TabsList>
              <TabsTrigger value="kanban" className="flex items-center space-x-2">
                <Circle className="h-4 w-4" />
                <span>Board</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center space-x-2">
                <CalendarDays className="h-4 w-4" />
                <span>Calendar</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
                  <Label htmlFor="scheduled_at">Schedule Date & Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background/50 border-white/20",
                          !newTask.scheduled_at && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {newTask.scheduled_at ? (
                          format(newTask.scheduled_at, "PPP 'at' p")
                        ) : (
                          <span>Pick a date and time</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newTask.scheduled_at}
                        onSelect={(date) => {
                          if (date) {
                            const newDate = new Date(date);
                            newDate.setHours(9, 0, 0, 0); // Default to 9 AM
                            setNewTask({ ...newTask, scheduled_at: newDate });
                          } else {
                            setNewTask({ ...newTask, scheduled_at: undefined });
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                      {newTask.scheduled_at && (
                        <div className="p-3 border-t">
                          <Input
                            type="time"
                            value={format(newTask.scheduled_at, "HH:mm")}
                            onChange={(e) => {
                              if (newTask.scheduled_at) {
                                const [hours, minutes] = e.target.value.split(':');
                                const newDate = new Date(newTask.scheduled_at);
                                newDate.setHours(parseInt(hours), parseInt(minutes));
                                setNewTask({ ...newTask, scheduled_at: newDate });
                              }
                            }}
                            className="bg-background/50 border-white/20"
                          />
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
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
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'kanban' | 'calendar')}>
        <TabsContent value="kanban">
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
                          
                          {task.scheduled_at && (
                            <div className="flex items-center mb-3">
                              <Calendar className="h-3 w-3 mr-1 text-purple-400" />
                              <span className="text-xs text-purple-400">
                                {formatDateTime(task.scheduled_at)}
                              </span>
                            </div>
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
        </TabsContent>

        <TabsContent value="calendar">
          {/* Calendar View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="glass-card lg:col-span-1">
              <CardHeader>
                <CardTitle className="gradient-text">Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="pointer-events-auto rounded-md border-0"
                  modifiers={{
                    hasTask: (date) => getTasksForDate(date).length > 0
                  }}
                  modifiersStyles={{
                    hasTask: {
                      backgroundColor: 'rgba(147, 51, 234, 0.2)',
                      color: 'rgb(147, 51, 234)',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Tasks for selected date */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="gradient-text">
                  Tasks for {format(selectedDate, "PPP")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getTasksForDate(selectedDate).map((task) => {
                    const config = getStatusConfig(task.status);
                    const StatusIcon = config.icon;
                    
                    return (
                      <Card key={task.id} className="glass-card hover:glow-effect transition-all duration-300 group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start space-x-3 flex-1">
                              <StatusIcon className={`h-4 w-4 mt-1 ${config.color}`} />
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground text-sm mb-1">
                                  {task.title}
                                </h3>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>{formatDateTime(task.scheduled_at!)}</span>
                                  <Badge variant="outline" className={`${config.color} border-current`}>
                                    {config.title}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-blue-500/20 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setEditingTask(task)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {getTasksForDate(selectedDate).length === 0 && (
                    <div className="text-center py-8">
                      <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground text-sm font-medium mb-1">No tasks scheduled</p>
                      <p className="text-muted-foreground/60 text-xs">
                        Select a different date or create a new task
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
                  status: editingTask.status,
                  scheduled_at: editingTask.scheduled_at
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
                <Label htmlFor="edit-scheduled_at">Schedule Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background/50 border-white/20",
                        !editingTask.scheduled_at && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {editingTask.scheduled_at ? (
                        format(new Date(editingTask.scheduled_at), "PPP 'at' p")
                      ) : (
                        <span>Pick a date and time</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editingTask.scheduled_at ? new Date(editingTask.scheduled_at) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const existingTime = editingTask.scheduled_at ? new Date(editingTask.scheduled_at) : new Date();
                          const newDate = new Date(date);
                          newDate.setHours(existingTime.getHours(), existingTime.getMinutes());
                          setEditingTask({ ...editingTask, scheduled_at: newDate.toISOString() });
                        } else {
                          setEditingTask({ ...editingTask, scheduled_at: undefined });
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                    {editingTask.scheduled_at && (
                      <div className="p-3 border-t">
                        <Input
                          type="time"
                          value={format(new Date(editingTask.scheduled_at), "HH:mm")}
                          onChange={(e) => {
                            if (editingTask.scheduled_at) {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(editingTask.scheduled_at);
                              newDate.setHours(parseInt(hours), parseInt(minutes));
                              setEditingTask({ ...editingTask, scheduled_at: newDate.toISOString() });
                            }
                          }}
                          className="bg-background/50 border-white/20"
                        />
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
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

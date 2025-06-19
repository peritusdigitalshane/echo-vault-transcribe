
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Archive, Eye, Trash2, Edit3, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'archived';
  position: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  notes: string | null;
}

const KanbanBoard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isArchiveViewOpen, setIsArchiveViewOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', notes: '' });
  const [selectedColumn, setSelectedColumn] = useState<'todo' | 'in_progress' | 'completed'>('todo');
  const { toast } = useToast();

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-blue-100 border-blue-200' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-100 border-yellow-200' },
    { id: 'completed', title: 'Completed', color: 'bg-green-100 border-green-200' }
  ] as const;

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .neq('status', 'archived')
        .order('position', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks.",
        variant: "destructive",
      });
    }
  };

  const fetchArchivedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'archived')
        .order('archived_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching archived tasks:', error);
      return [];
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description || null,
          notes: newTask.notes || null,
          status: selectedColumn,
          user_id: session.user.id,
          position: tasks.filter(t => t.status === selectedColumn).length
        });

      if (error) throw error;

      toast({
        title: "Task Added",
        description: "Your task has been created successfully.",
      });

      setNewTask({ title: '', description: '', notes: '' });
      setIsAddTaskOpen(false);
      await fetchTasks();
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add task.",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.position = tasks.filter(t => t.status === 'completed').length;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Task Updated",
        description: "Task status has been updated successfully.",
      });

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

  const archiveTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Task Archived",
        description: "Task has been archived successfully.",
      });

      await fetchTasks();
    } catch (error: any) {
      console.error('Error archiving task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to archive task.",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Task Deleted",
        description: "Task has been deleted successfully.",
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

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold gradient-text">Task Board</h1>
        <div className="flex space-x-2">
          <Dialog open={isArchiveViewOpen} onOpenChange={setIsArchiveViewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Archive
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Archived Tasks</DialogTitle>
              </DialogHeader>
              <ArchivedTasksView />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taskTitle">Title</Label>
                  <Input
                    id="taskTitle"
                    placeholder="Enter task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="taskDescription">Description</Label>
                  <Textarea
                    id="taskDescription"
                    placeholder="Enter task description..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="taskNotes">Notes</Label>
                  <Textarea
                    id="taskNotes"
                    placeholder="Enter task notes..."
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="taskColumn">Add to Column</Label>
                  <select
                    id="taskColumn"
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value as 'todo' | 'in_progress' | 'completed')}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <Button onClick={addTask} className="w-full">
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className={`p-4 rounded-lg border-2 ${column.color}`}>
              <h3 className="font-semibold text-lg mb-2">{column.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {getTasksByStatus(column.id).length} tasks
              </Badge>
            </div>
            
            <div className="space-y-3 min-h-[400px]">
              {getTasksByStatus(column.id).map((task) => (
                <Card key={task.id} className="glass-card hover:glow-effect transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{task.title}</h4>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    )}
                    
                    {task.notes && (
                      <div className="bg-blue-50 p-2 rounded text-xs mb-2">
                        <strong>Notes:</strong> {task.notes}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between space-x-2">
                      {column.id !== 'todo' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, column.id === 'in_progress' ? 'todo' : 'in_progress')}
                        >
                          ← Move Left
                        </Button>
                      )}
                      
                      {column.id !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, column.id === 'todo' ? 'in_progress' : 'completed')}
                        >
                          Move Right →
                        </Button>
                      )}
                      
                      {column.id === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => archiveTask(task.id)}
                        >
                          <Archive className="h-3 w-3 mr-1" />
                          Archive
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ArchivedTasksView = () => {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadArchivedTasks();
  }, []);

  const loadArchivedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'archived')
        .order('archived_at', { ascending: false });

      if (error) throw error;
      setArchivedTasks(data || []);
    } catch (error: any) {
      console.error('Error loading archived tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load archived tasks.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {archivedTasks.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No archived tasks found.</p>
      ) : (
        archivedTasks.map((task) => (
          <Card key={task.id} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium">{task.title}</h4>
                <Badge variant="secondary">Archived</Badge>
              </div>
              
              {task.description && (
                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
              )}
              
              {task.notes && (
                <div className="bg-blue-50 p-2 rounded text-xs mb-2">
                  <strong>Notes:</strong> {task.notes}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                <span>Archived: {new Date(task.archived_at || '').toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default KanbanBoard;

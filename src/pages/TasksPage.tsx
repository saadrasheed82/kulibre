import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2, Clock, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

// Define the Task type
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  user_id?: string;
  created_at: string;
  updated_at: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('medium');
  
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate('/login');
      }
    };
    
    checkUser();
  }, [navigate]);

  // Check if the tasks table exists
  useEffect(() => {
    const checkTasksTable = async () => {
      try {
        // Check if the table exists
        const { error: checkError } = await supabase
          .from('user_tasks')
          .select('id')
          .limit(1);
        
        // If the table doesn't exist, show a message
        if (checkError) {
          const errorMessage = checkError.message || JSON.stringify(checkError);
          console.log('The user_tasks table does not exist. Please create it in the Supabase dashboard.');
          console.log('Error details:', errorMessage);
          
          // Only show the toast once
          toast.error('Tasks feature requires database setup. Please contact the administrator.', {
            id: 'table-missing',
            duration: 5000
          });
        }
      } catch (error) {
        console.error('Error checking table:', error);
      }
    };
    
    checkTasksTable();
  }, []);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData.user) {
          throw new Error('User not authenticated');
        }
        
        // Try to get tasks
        const { data, error } = await supabase
          .from('user_tasks')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          // Table doesn't exist or other error, set empty tasks
          console.error('Error fetching tasks:', error);
          setTasks([]);
          setFilteredTasks([]);
          return;
        }
        
        if (data) {
          setTasks(data);
          setFilteredTasks(data);
        } else {
          // No data returned, set empty arrays
          setTasks([]);
          setFilteredTasks([]);
        }
      } catch (error: any) {
        console.error('Error fetching tasks:', error);
        // Set empty arrays to prevent undefined errors
        setTasks([]);
        setFilteredTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  // Filter tasks based on active tab and search query
  useEffect(() => {
    let result = [...tasks];
    
    // Filter by status
    if (activeTab !== 'all') {
      result = result.filter(task => task.status === activeTab);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        task => 
          task.title.toLowerCase().includes(query) || 
          (task.description && task.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredTasks(result);
  }, [tasks, activeTab, searchQuery]);

  // Add a new task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      const newTask = {
        title,
        description: description || null,
        due_date: dueDate ? dueDate.toISOString() : null,
        status,
        priority,
        user_id: userData.user.id
      };
      
      const { data, error } = await supabase
        .from('user_tasks')
        .insert(newTask)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding task:', error);
        
        // Check if it's a "relation does not exist" error
        const errorText = JSON.stringify(error).toLowerCase();
        if (errorText.includes('relation') && errorText.includes('exist')) {
          toast.error('Tasks feature requires database setup. Please contact the administrator.', {
            id: 'table-missing',
            duration: 5000
          });
          return;
        }
        
        throw error;
      }
      
      if (data) {
        setTasks(prevTasks => [data, ...prevTasks]);
        toast.success('Task added successfully');
        
        // Reset form
        setTitle('');
        setDescription('');
        setDueDate(undefined);
        setStatus('pending');
        setPriority('medium');
      }
    } catch (error: any) {
      console.error('Error adding task:', error);
      const errorMessage = error.message || (typeof error === 'string' ? error : 'Unknown error');
      toast.error('Error adding task: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update task status
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updateData = newStatus === 'done' 
        ? { status: newStatus, completed_at: new Date().toISOString() }
        : { status: newStatus, completed_at: null };
        
      const { error } = await supabase
        .from('user_tasks')
        .update(updateData)
        .eq('id', taskId);
      
      if (error) {
        console.error('Error updating task:', error);
        
        // Check if it's a "relation does not exist" error
        const errorText = JSON.stringify(error).toLowerCase();
        if (errorText.includes('relation') && errorText.includes('exist')) {
          toast.error('Tasks feature requires database setup. Please contact the administrator.', {
            id: 'table-missing',
            duration: 5000
          });
          return;
        }
        
        throw error;
      }
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, ...updateData } : task
        )
      );
      
      toast.success(`Task marked as ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating task:', error);
      const errorMessage = error.message || (typeof error === 'string' ? error : 'Unknown error');
      toast.error('Error updating task: ' + errorMessage);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const { error } = await supabase
        .from('user_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) {
        console.error('Error deleting task:', error);
        
        // Check if it's a "relation does not exist" error
        const errorText = JSON.stringify(error).toLowerCase();
        if (errorText.includes('relation') && errorText.includes('exist')) {
          toast.error('Tasks feature requires database setup. Please contact the administrator.', {
            id: 'table-missing',
            duration: 5000
          });
          return;
        }
        
        throw error;
      }
      
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error: any) {
      console.error('Error deleting task:', error);
      const errorMessage = error.message || (typeof error === 'string' ? error : 'Unknown error');
      toast.error('Error deleting task: ' + errorMessage);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return format(new Date(dateString), 'PPP');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your personal tasks and to-dos
          </p>
        </div>
        <div className="w-full md:w-1/3">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Task Form */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Add New Task</CardTitle>
            <CardDescription>
              Create a new task to keep track of your to-dos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Task description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Task List */}
        <div className="md:col-span-2">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="done">Done</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="bg-muted rounded-full p-3 mb-4">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg">No tasks found</h3>
                  <p className="text-muted-foreground mt-1">
                    {searchQuery 
                      ? "Try adjusting your search or filters" 
                      : "Add a new task to get started"}
                  </p>
                  <div className="mt-4 max-w-md text-sm text-muted-foreground">
                    <p>If you're seeing errors, the tasks database table might not be set up yet.</p>
                    <p className="mt-1">Please check the TASKS_SETUP.md file for instructions on how to set up the tasks feature.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <Card key={task.id} className="overflow-hidden">
                      <div className={cn(
                        "h-1",
                        task.status === 'pending' ? "bg-yellow-500" :
                        task.status === 'in-progress' ? "bg-blue-500" :
                        "bg-green-500"
                      )} />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateTaskStatus(
                                  task.id, 
                                  task.status === 'done' ? 'pending' : 'done'
                                )}
                                className={cn(
                                  "h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
                                  task.status === 'done'
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-gray-300 hover:border-green-500"
                                )}
                              >
                                {task.status === 'done' && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                              </button>
                              <h3 className={cn(
                                "font-medium",
                                task.status === 'done' && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </h3>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                task.priority === 'high' ? "bg-red-100 text-red-700" :
                                task.priority === 'medium' ? "bg-yellow-100 text-yellow-700" :
                                "bg-green-100 text-green-700"
                              )}
                            >
                              {task.priority}
                            </span>
                            
                            {task.status !== 'done' && (
                              <Select 
                                value={task.status} 
                                onValueChange={(value) => handleUpdateTaskStatus(task.id, value)}
                              >
                                <SelectTrigger className="h-8 w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {task.due_date && (
                          <div className="mt-2 flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Due: {formatDate(task.due_date)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
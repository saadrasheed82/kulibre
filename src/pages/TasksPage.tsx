import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Filter,
  Plus,
  Search,
  Calendar,
  Trash2,
  Edit,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define Task type
interface Task {
  id: string;
  title: string;
  project_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  // These fields are not in the database but used in the UI
  description?: string | null;
  status?: "todo" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
  assigned_to?: string | null;
  updated_at?: string;
  project?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  assigned_users?: User[];
}

// Define Project type for dropdown
interface Project {
  id: string;
  name: string;
}

// Define User type for dropdown
interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function TasksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    project_id: "none",
    status: "todo",
    priority: "medium",
    assigned_to: "none",
    assigned_users: [] as string[],
    due_date: null as Date | null
  });

  // Fetch tasks
  const { data: tasks, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', searchQuery, statusFilter, priorityFilter, projectFilter, assigneeFilter],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          project_id,
          due_date,
          completed_at,
          created_at,
          project:project_id (id, name)
        `);

      // Apply filters
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      if (statusFilter) {
        if (statusFilter === 'completed') {
          query = query.not('completed_at', 'is', null);
        } else {
          query = query.is('completed_at', null);
        }
      }

      if (projectFilter && projectFilter !== "all") {
        query = query.eq('project_id', projectFilter);
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }

      // Fetch all user assignments in a single query
      const { data: allUserTasks, error: userTasksError } = await supabase
        .from('user_tasks')
        .select(`
          task_id,
          user_id
        `)
        .in('task_id', (data as Task[]).map(task => task.id));

      if (userTasksError) {
        console.error("Error fetching user tasks:", userTasksError);
      }

      // Get all unique user IDs
      const userIds = [...new Set(allUserTasks?.map(ut => ut.user_id) || [])];

      // Fetch user details
      const { data: userDetails, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (userError) {
        console.error("Error fetching user details:", userError);
      }

      // Create a map of user IDs to user objects
      const userMap: Record<string, User> = {};
      userDetails?.forEach(user => {
        userMap[user.id] = user;
      });

      // Group user assignments by task
      const userTasksByTaskId: Record<string, User[]> = {};
      allUserTasks?.forEach(ut => {
        if (!userTasksByTaskId[ut.task_id]) {
          userTasksByTaskId[ut.task_id] = [];
        }
        const user = userMap[ut.user_id];
        if (user) {
          userTasksByTaskId[ut.task_id].push(user);
        }
      });

      // Add user assignments to tasks and default values for UI
      let tasksWithAssignments = (data as Task[]).map(task => ({
        ...task,
        assigned_users: userTasksByTaskId[task.id] || [],
        status: task.completed_at ? 'completed' : 'todo',
        priority: 'medium' // Default priority since it's not in the database
      }));

      // Apply client-side filters

      // Filter by assignee if needed
      if (assigneeFilter && assigneeFilter !== "all") {
        tasksWithAssignments = tasksWithAssignments.filter(task =>
          task.assigned_users?.some(user => user.id === assigneeFilter)
        );
      }

      // Filter by priority if needed
      if (priorityFilter && priorityFilter !== "all") {
        tasksWithAssignments = tasksWithAssignments.filter(task =>
          task.priority === priorityFilter
        );
      }

      return tasksWithAssignments as Task[];
    }
  });

  // Fetch projects for dropdown
  const { data: projects } = useQuery({
    queryKey: ['projects-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) {
        console.error("Error fetching projects:", error);
        throw error;
      }

      return data as Project[];
    }
  });

  // Fetch users for dropdown
  const { data: users } = useQuery({
    queryKey: ['users-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .order('full_name');

      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }

      return data as User[];
    }
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (task: typeof newTask) => {
      try {
        console.log("Starting task creation with:", task);

        // First, insert the task
        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            title: task.title,
            project_id: task.project_id && task.project_id !== "none" ? task.project_id : null,
            due_date: task.due_date ? format(task.due_date, 'yyyy-MM-dd') : null,
            completed_at: null
          }])
          .select();

        if (error) {
          console.error("Error inserting task:", error);
          throw error;
        }

        console.log("Task created successfully:", data);

        // If we have assigned users, create user_task entries
        if (task.assigned_users.length > 0 && data && data[0]) {
          const taskId = data[0].id;
          console.log("Adding user assignments for task:", taskId);

          // Create user task entries one by one to avoid potential issues
          for (const userId of task.assigned_users) {
            console.log("Adding assignment for user:", userId);
            const { error: userTaskError } = await supabase
              .from('user_tasks')
              .insert({
                user_id: userId,
                task_id: taskId
              });

            if (userTaskError) {
              console.error(`Error adding user task assignment for user ${userId}:`, userTaskError);
              // Continue with other assignments even if one fails
            }
          }
        }

        return data;
      } catch (error) {
        console.error("Unexpected error in task creation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        console.log("Task added successfully, invalidating queries");
        queryClient.invalidateQueries({ queryKey: ['tasks'] });

        console.log("Showing success toast");
        toast({
          title: "Task added",
          description: "The task has been added successfully.",
        });

        console.log("Closing dialog and resetting form");
        setIsAddTaskOpen(false);
        resetNewTaskForm();
      } catch (error) {
        console.error("Error in onSuccess handler:", error);
      }
    },
    onError: (error: any) => {
      try {
        console.error("Error in task mutation:", error);
        toast({
          title: "Error adding task",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
      } catch (toastError) {
        console.error("Error showing error toast:", toastError);
      }
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      // First, update the task
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          project_id: task.project_id && task.project_id !== "none" ? task.project_id : null,
          due_date: task.due_date,
          completed_at: task.status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', task.id)
        .select();

      if (error) throw error;

      // Always delete existing assignments first
      const { error: deleteError } = await supabase
        .from('user_tasks')
        .delete()
        .eq('task_id', task.id);

      if (deleteError) {
        console.error("Error deleting existing user task assignments:", deleteError);
        // Continue even if delete fails
      }

      // If we have assigned users, create new assignments
      if (task.assigned_users && task.assigned_users.length > 0) {
        // Create user task entries one by one to avoid potential issues
        for (const user of task.assigned_users) {
          const { error: insertError } = await supabase
            .from('user_tasks')
            .insert({
              user_id: user.id,
              task_id: task.id
            });

          if (insertError) {
            console.error(`Error adding user task assignment for user ${user.id}:`, insertError);
            // Continue with other assignments even if one fails
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Task updated",
        description: "The task has been updated successfully.",
      });
      setIsEditTaskOpen(false);
      setCurrentTask(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // First delete user task assignments
      const { error: userTaskError } = await supabase
        .from('user_tasks')
        .delete()
        .eq('task_id', taskId);

      if (userTaskError) {
        console.error("Error deleting user task assignments:", userTaskError);
        // Continue with task deletion even if user_tasks deletion fails
      }

      // Then delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle task status mutation
  const toggleTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('tasks')
        .update({
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating task status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Reset new task form
  const resetNewTaskForm = () => {
    setNewTask({
      title: "",
      description: "",
      project_id: "none",
      status: "todo",
      priority: "medium",
      assigned_to: "none",
      assigned_users: [],
      due_date: null
    });
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    // Make sure we have the assigned_users array
    const taskWithUsers = {
      ...task,
      assigned_users: task.assigned_users || []
    };
    setCurrentTask(taskWithUsers);
    setIsEditTaskOpen(true);
  };

  // Handle task status toggle
  const handleToggleStatus = (task: Task) => {
    const newStatus = task.completed_at ? 'todo' : 'completed';
    toggleTaskStatusMutation.mutate({ taskId: task.id, newStatus });
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error("Invalid date:", dateString);
      return 'Invalid date';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800",
      medium: "bg-amber-100 text-amber-800",
      low: "bg-green-100 text-green-800"
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  // Get status icon
  const getStatusIcon = (task: Task) => {
    if (task.completed_at) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else {
      return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  // Filter tasks by status for tabs
  const completedTasks = tasks?.filter(task => task.completed_at !== null) || [];
  const todoTasks = tasks?.filter(task => task.completed_at === null) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground mt-1">Manage your tasks and track progress</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8 w-full sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={priorityFilter || "all"}
                    onValueChange={(value) => setPriorityFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select
                    value={projectFilter || "all"}
                    onValueChange={(value) => setProjectFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All projects</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={assigneeFilter || "all"}
                    onValueChange={(value) => setAssigneeFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All assignees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All assignees</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter("all");
                      setPriorityFilter("all");
                      setProjectFilter("all");
                      setAssigneeFilter("all");
                    }}
                  >
                    Reset
                  </Button>
                  <Button>Apply Filters</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={() => {
            console.log("Add Task button clicked");
            setIsAddTaskOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderTasksList(tasks || [])}
        </TabsContent>

        <TabsContent value="todo" className="mt-6">
          {renderTasksList(todoTasks)}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {renderTasksList(completedTasks)}
        </TabsContent>
      </Tabs>

      {/* Add Task Dialog */}
      {isAddTaskOpen && (
        <Dialog open={true} onOpenChange={(open) => {
          console.log("Dialog open state changing to:", open);
          setIsAddTaskOpen(open);
        }}>
          <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="project">Project</Label>
                <Select
                  value={newTask.project_id || "none"}
                  onValueChange={(value) => setNewTask({ ...newTask, project_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger id="project" className="h-8">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="assignee">Primary Assignee</Label>
                <Select
                  value={newTask.assigned_to || "none"}
                  onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value === "none" ? "" : value })}
                >
                  <SelectTrigger id="assignee" className="h-8">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="assigned-users">Additional Team Members</Label>
                <div className="border rounded-md p-1">
                  <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto">
                    {users?.map((user) => (
                      <div
                        key={user.id}
                        className={`px-2 py-0.5 rounded-full text-xs cursor-pointer ${
                          newTask.assigned_users.includes(user.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                        onClick={() => {
                          const currentValues = [...newTask.assigned_users];
                          if (currentValues.includes(user.id)) {
                            setNewTask({
                              ...newTask,
                              assigned_users: currentValues.filter(v => v !== user.id)
                            });
                          } else {
                            setNewTask({
                              ...newTask,
                              assigned_users: [...currentValues, user.id]
                            });
                          }
                        }}
                      >
                        {user.full_name}
                      </div>
                    ))}
                  </div>
                </div>
                {newTask.assigned_users.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Selected: {newTask.assigned_users.length} team member(s)
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newTask.status}
                  onValueChange={(value) => setNewTask({ ...newTask, status: value as any })}
                >
                  <SelectTrigger id="status" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value as any })}
                >
                  <SelectTrigger id="priority" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-8 text-sm"
                  >
                    <Calendar className="mr-2 h-3 w-3" />
                    {newTask.due_date ? format(newTask.due_date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={newTask.due_date}
                    onSelect={(date) => setNewTask({ ...newTask, due_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                try {
                  console.log("Adding task:", newTask);
                  addTaskMutation.mutate(newTask);
                } catch (error) {
                  console.error("Error in Add Task button click:", error);
                }
              }}
              disabled={!newTask.title.trim() || addTaskMutation.isPending}
            >
              {addTaskMutation.isPending ? "Adding..." : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Edit Task Dialog */}
      {currentTask && isEditTaskOpen && (
        <Dialog open={true} onOpenChange={(open) => {
          console.log("Edit Dialog open state changing to:", open);
          setIsEditTaskOpen(open);
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={currentTask.title}
                  onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={currentTask.description || ""}
                  onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-project">Project</Label>
                  <Select
                    value={currentTask.project_id || "none"}
                    onValueChange={(value) => setCurrentTask({ ...currentTask, project_id: value === "none" ? null : value })}
                  >
                    <SelectTrigger id="edit-project" className="h-8">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-assignee">Primary Assignee</Label>
                  <Select
                    value={currentTask.assigned_to || "none"}
                    onValueChange={(value) => setCurrentTask({ ...currentTask, assigned_to: value === "none" ? null : value })}
                  >
                    <SelectTrigger id="edit-assignee" className="h-8">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1 col-span-2 mt-2">
                <Label htmlFor="edit-assigned-users">Additional Team Members</Label>
                <div className="border rounded-md p-1">
                  <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto">
                    {users?.map((user) => {
                      const isSelected = currentTask.assigned_users?.some(u => u.id === user.id) || false;
                      return (
                        <div
                          key={user.id}
                          className={`px-2 py-0.5 rounded-full text-xs cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                          onClick={() => {
                            let newAssignedUsers: User[] = [...(currentTask.assigned_users || [])];

                            if (isSelected) {
                              // Remove user
                              newAssignedUsers = newAssignedUsers.filter(u => u.id !== user.id);
                            } else {
                              // Add user
                              newAssignedUsers.push(user);
                            }

                            setCurrentTask({
                              ...currentTask,
                              assigned_users: newAssignedUsers
                            });
                          }}
                        >
                          {user.full_name}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {(currentTask.assigned_users?.length || 0) > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Selected: {currentTask.assigned_users?.length} team member(s)
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={currentTask.status}
                    onValueChange={(value) => setCurrentTask({ ...currentTask, status: value as any })}
                  >
                    <SelectTrigger id="edit-status" className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={currentTask.priority}
                    onValueChange={(value) => setCurrentTask({ ...currentTask, priority: value as any })}
                  >
                    <SelectTrigger id="edit-priority" className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-8 text-sm"
                    >
                      <Calendar className="mr-2 h-3 w-3" />
                      {currentTask.due_date ? formatDate(currentTask.due_date) : <span>No due date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={currentTask.due_date ? parseISO(currentTask.due_date) : undefined}
                      onSelect={(date) => setCurrentTask({
                        ...currentTask,
                        due_date: date ? format(date, 'yyyy-MM-dd') : null
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteTaskMutation.mutate(currentTask.id);
                  setIsEditTaskOpen(false);
                }}
                disabled={deleteTaskMutation.isPending}
              >
                {deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={() => updateTaskMutation.mutate(currentTask)}
                disabled={!currentTask.title.trim() || updateTaskMutation.isPending}
              >
                {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  // Helper function to render tasks list
  function renderTasksList(tasksList: Task[]) {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-2">Error loading tasks</p>
            <p className="text-muted-foreground">There was a problem loading your tasks. Please try again later.</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (tasksList.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No tasks found</p>
            <Button onClick={() => setIsAddTaskOpen(true)} className="mt-4">
              Create a Task
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {tasksList.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleToggleStatus(task)}
                  className="mt-1"
                >
                  {getStatusIcon(task)}
                </button>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium">{task.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTask(task)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority} priority
                    </Badge>
                    {task.project && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-800">
                        {task.project.name}
                      </Badge>
                    )}
                    {task.due_date && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-800">
                        Due {formatDate(task.due_date)}
                      </Badge>
                    )}
                    {task.assignee && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        Primary: {task.assignee.full_name}
                      </Badge>
                    )}
                    {task.assigned_users && task.assigned_users.length > 0 && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Team: {task.assigned_users.length} member{task.assigned_users.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}
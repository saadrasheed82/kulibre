
import { Clock, CheckSquare, AlertTriangle, FolderKanban } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { TeamWorkloadChart } from "@/components/dashboard/TeamWorkloadChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";



const teamWorkloadData = [
  { name: "Alex", tasks: 8, max: 10 },
  { name: "Jamie", tasks: 5, max: 10 },
  { name: "Taylor", tasks: 12, max: 10 },
  { name: "Morgan", tasks: 3, max: 10 },
  { name: "Jordan", tasks: 7, max: 10 },
];

export default function Index() {
  const navigate = useNavigate();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // No project queries needed

  // Fetch tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            project:project_id (id, name)
          `)
          .is('completed_at', null)
          .order('due_date', { ascending: true })
          .limit(3);

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }
    }
  });

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back to Creatively</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Tasks"
          value="5"
          icon={<FolderKanban className="h-5 w-5" />}
          description="In progress"
          trend="up"
          trendValue="↑ 2 new this week"
        />
        <StatCard
          title="Tasks Due Today"
          value={tasks?.length.toString() || "0"}
          icon={<Clock className="h-5 w-5" />}
          description="3 high priority"
          trend="neutral"
          trendValue="Same as yesterday"
          bgColor="bg-creatively-yellow/50"
        />
        <StatCard
          title="Completed Tasks"
          value="124"
          icon={<CheckSquare className="h-5 w-5" />}
          description="This week"
          trend="up"
          trendValue="↑ 15% from last week"
          bgColor="bg-creatively-green/50"
        />
        <StatCard
          title="Pending Feedback"
          value="4"
          icon={<AlertTriangle className="h-5 w-5" />}
          description="Client review needed"
          trend="down"
          trendValue="↓ 2 from yesterday"
          bgColor="bg-creatively-orange/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
            </div>

            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Your recent activity will appear here.
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tasks Due Today</CardTitle>
                <Button variant="ghost" size="sm">See All</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingTasks ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-1" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </>
              ) : tasks && tasks.length > 0 ? (
                <>
                  {tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      title={task.title}
                      project={task.project?.name || "No Project"}
                      dueTime={task.due_date ? new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today"}
                      priority={(task.priority === "high" || task.priority === "medium" || task.priority === "low") ? task.priority : "medium"}
                      completed={completedTasks.includes(task.id)}
                      onClick={() => toggleTaskCompletion(task.id)}
                    />
                  ))}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-4">No tasks due today. Enjoy your day!</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Workload</CardTitle>
              <CardDescription>Current tasks assigned per team member</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <TeamWorkloadChart data={teamWorkloadData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

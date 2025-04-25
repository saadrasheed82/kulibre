
import { FolderKanban, Clock, CheckSquare, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { ProjectProgressChart } from "@/components/dashboard/ProjectProgressChart";
import { TeamWorkloadChart } from "@/components/dashboard/TeamWorkloadChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const projectProgressData = [
  { name: "Completed", value: 12, color: "#9b87f5" },
  { name: "In Progress", value: 8, color: "#FEC6A1" },
  { name: "Not Started", value: 5, color: "#D3E4FD" },
];

const teamWorkloadData = [
  { name: "Alex", tasks: 8, max: 10 },
  { name: "Jamie", tasks: 5, max: 10 },
  { name: "Taylor", tasks: 12, max: 10 },
  { name: "Morgan", tasks: 3, max: 10 },
  { name: "Jordan", tasks: 7, max: 10 },
];

export default function Index() {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back to Creatively</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard 
            title="Total Projects" 
            value="25" 
            icon={<FolderKanban className="h-5 w-5" />} 
            description="5 active, 20 completed"
            trend="up"
            trendValue="↑ 10% from last month"
          />
          <StatCard 
            title="Tasks Due Today" 
            value="8" 
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
            title="Projects Pending Feedback" 
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
                <h2 className="text-xl font-semibold">Recent Projects</h2>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProjectCard 
                  title="Brand Refresh" 
                  client="Acme Inc." 
                  progress={75} 
                  dueDate="June 30" 
                  type="Branding" 
                  status="on-track"
                  teamMembers={[
                    { initials: "JS", color: "bg-creatively-purple" },
                    { initials: "AL", color: "bg-creatively-orange" },
                    { initials: "TW", color: "bg-creatively-blue" },
                  ]}
                />
                <ProjectCard 
                  title="Website Redesign" 
                  client="TechCorp" 
                  progress={40} 
                  dueDate="July 15" 
                  type="Web Design" 
                  status="at-risk"
                  teamMembers={[
                    { initials: "MK", color: "bg-creatively-pink" },
                    { initials: "RJ", color: "bg-creatively-blue" },
                  ]}
                />
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>Overview of all project statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectProgressChart data={projectProgressData} />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tasks Due Today</CardTitle>
                  <Button variant="ghost" size="sm">See All</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <TaskCard 
                  title="Submit final logo designs" 
                  project="Brand Refresh" 
                  dueTime="2:00 PM" 
                  priority="high"
                  completed={completedTasks.includes('task1')}
                  onClick={() => toggleTaskCompletion('task1')}
                />
                <TaskCard 
                  title="Review client feedback" 
                  project="Website Redesign" 
                  dueTime="3:30 PM" 
                  priority="medium"
                  completed={completedTasks.includes('task2')}
                  onClick={() => toggleTaskCompletion('task2')}
                />
                <TaskCard 
                  title="Team check-in meeting" 
                  project="Internal" 
                  dueTime="4:00 PM" 
                  priority="low"
                  completed={completedTasks.includes('task3')}
                  onClick={() => toggleTaskCompletion('task3')}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Team Workload</CardTitle>
                <CardDescription>Current tasks assigned per team member</CardDescription>
              </CardHeader>
              <CardContent>
                <TeamWorkloadChart data={teamWorkloadData} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

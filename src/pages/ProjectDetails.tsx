import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Edit2, MoreVertical, Bell, UserPlus, Settings, Archive, Download } from "lucide-react";
import { OverviewTab } from "@/components/project/OverviewTab";
import { TaskBoardTab } from "@/components/project/TaskBoardTab";
import { FilesTab } from "@/components/project/FilesTab";
import { FeedbackTab } from "@/components/project/FeedbackTab";
import { CommentsTab } from "@/components/project/CommentsTab";
import { TimelineTab } from "@/components/project/TimelineTab";
import { cn } from "@/lib/utils";

interface ProjectDetailsProps {
  id?: string;
}

export default function ProjectDetails({ id }: ProjectDetailsProps) {
  const [status, setStatus] = useState<'In Progress' | 'Awaiting Feedback' | 'Approved' | 'Archived'>('In Progress');
  const [progress, setProgress] = useState(65);

  const statusColors = {
    'In Progress': 'bg-blue-100 text-blue-700',
    'Awaiting Feedback': 'bg-yellow-100 text-yellow-700',
    'Approved': 'bg-green-100 text-green-700',
    'Archived': 'bg-gray-100 text-gray-700',
  };

  const team = [
    { name: 'Sarah Khan', initials: 'SK' },
    { name: 'Mike Chen', initials: 'MC' },
    { name: 'Anna Smith', initials: 'AS' },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto flex">
      <div className="flex-1">
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold">Brand Refresh Project</h1>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Jan 15 - Mar 30, 2024
                </span>
                <span>Client: Acme Corp</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  statusColors[status]
                )}
              >
                {status}
              </span>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Team:</span>
              <div className="flex -space-x-2">
                {team.map((member, i) => (
                  <Avatar key={i} className="border-2 border-white">
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-dashed"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Task Board</TabsTrigger>
              <TabsTrigger value="files">Files & Assets</TabsTrigger>
              <TabsTrigger value="feedback">Feedback & Approvals</TabsTrigger>
              <TabsTrigger value="comments">Comments/Notes</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <OverviewTab />
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <TaskBoardTab />
            </TabsContent>

            <TabsContent value="files" className="mt-6">
              <FilesTab />
            </TabsContent>

            <TabsContent value="feedback" className="mt-6">
              <FeedbackTab />
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              <CommentsTab />
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <TimelineTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Sidebar */}
      <Card className="w-80 p-4 fixed right-6 top-24 space-y-6">
        <div>
          <h3 className="font-medium mb-3">Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <Bell className="h-4 w-4 mt-0.5 text-blue-500" />
              <div>
                <p>Client approved file v2</p>
                <p className="text-muted-foreground">10 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Bell className="h-4 w-4 mt-0.5 text-yellow-500" />
              <div>
                <p>New feedback received</p>
                <p className="text-muted-foreground">2 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3">Quick Links</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team/Client
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Project Settings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Archive className="h-4 w-4 mr-2" />
              Export/Archive Project
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>Last Updated</span>
            <span>5 minutes ago by Sarah Khan</span>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export Project Report
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600">
              <Archive className="h-4 w-4 mr-2" />
              Archive Project
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

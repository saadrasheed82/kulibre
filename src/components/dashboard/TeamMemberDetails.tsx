import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  FileText,
  Mail,
  Phone,
  User,
  Building,
  Shield,
  CheckCircle2,
  XCircle
} from "lucide-react";

type TeamMember = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string;
  role: "admin" | "team_member" | "client";
  status: "active" | "invited" | "inactive";
  company: string | null;
  created_at: string | null;
};



interface TeamMemberDetailsProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamMemberDetails({ member, open, onOpenChange }: TeamMemberDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");



  const recentActivity = [
    { id: "act-1", description: "Completed task: Design homepage mockup", date: "2 hours ago" },
    { id: "act-2", description: "Commented on Website Launch task", date: "Yesterday" },
    { id: "act-3", description: "Uploaded new file: logo_final.png", date: "3 days ago" }
  ];

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "invited":
        return <Badge className="bg-yellow-500">Invited</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get role display name
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "team_member":
        return "Team Member";
      case "client":
        return "Client";
      default:
        return role;
    }
  };



  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Member Details</DialogTitle>
          <DialogDescription>
            View detailed information about this team member
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 py-4">
          {/* Member profile sidebar */}
          <div className="md:w-1/3 flex flex-col items-center md:items-start">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="text-3xl bg-creatively-purple/10 text-creatively-purple">
                {member.full_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold mb-1">{member.full_name}</h3>
            <div className="mb-3">{getStatusBadge(member.status)}</div>

            <div className="space-y-3 w-full">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>{getRoleDisplay(member.role)}</span>
              </div>
              {member.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{member.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {new Date(member.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-6 w-full">
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>

          {/* Main content area */}
          <div className="md:w-2/3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                    <CardDescription>Overview of team member's activity and status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Completed Tasks</p>
                        <p className="text-2xl font-semibold">12</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Hours Logged</p>
                        <p className="text-2xl font-semibold">48.5</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Last Active</p>
                        <p className="text-2xl font-semibold">Today</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>


              </TabsContent>



              <TabsContent value="activity" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest actions and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {recentActivity.map(activity => (
                        <div key={activity.id} className="flex gap-3">
                          <div className="mt-0.5">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">{activity.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Edit2, MoreVertical, Bell, UserPlus, Settings, Archive, Download, Save } from "lucide-react";
import { OverviewTab } from "@/components/project/OverviewTab";
import { TaskBoardTab } from "@/components/project/TaskBoardTab";
import { FilesTab } from "@/components/project/FilesTab";
import { FeedbackTab } from "@/components/project/FeedbackTab";
import { CommentsTab } from "@/components/project/CommentsTab";
import { TimelineTab } from "@/components/project/TimelineTab";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface ProjectDetailsProps {
  id?: string;
}

export default function ProjectDetails({ id: propId }: ProjectDetailsProps) {
  const { id: routeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're creating a new project
  const isNewProject = location.pathname === '/projects/new';
  const projectId = propId || routeId;

  // State for project details
  const [projectName, setProjectName] = useState(isNewProject ? "" : "Brand Refresh Project");
  const [projectDescription, setProjectDescription] = useState(isNewProject ? "" : "A complete brand refresh for Acme Corp including logo, color palette, and brand guidelines.");
  const [clientName, setClientName] = useState(isNewProject ? "" : "Acme Corp");
  const [startDate, setStartDate] = useState(isNewProject ? "" : "2024-01-15");
  const [dueDate, setDueDate] = useState(isNewProject ? "" : "2024-03-30");
  const [projectType, setProjectType] = useState(isNewProject ? "Branding" : "Branding");
  const [status, setStatus] = useState<'In Progress' | 'Awaiting Feedback' | 'Approved' | 'Archived' | 'Not Started'>(
    isNewProject ? 'Not Started' : 'In Progress'
  );
  const [progress, setProgress] = useState(isNewProject ? 0 : 65);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusColors = {
    'In Progress': 'bg-blue-100 text-blue-700',
    'Awaiting Feedback': 'bg-yellow-100 text-yellow-700',
    'Approved': 'bg-green-100 text-green-700',
    'Archived': 'bg-gray-100 text-gray-700',
    'Not Started': 'bg-purple-100 text-purple-700',
  };

  const team = [
    { name: 'Sarah Khan', initials: 'SK' },
    { name: 'Mike Chen', initials: 'MC' },
    { name: 'Anna Smith', initials: 'AS' },
  ];

  // Handle project creation/update
  const handleSaveProject = async () => {
    if (!projectName) {
      alert("Project name is required");
      return;
    }

    // Clear any previous errors
    setError(null);
    setIsSaving(true);
    
    try {
      if (isNewProject) {
        // Create new project
        // Map the status to the enum values expected by the database
        let dbStatus: Database["public"]["Enums"]["project_status"] = "draft";
        
        // Handle status mapping with better error handling
        try {
          if (status === "Not Started") {
            dbStatus = "draft";
          } else if (status === "In Progress") {
            dbStatus = "in_progress";
          } else if (status === "Awaiting Feedback") {
            dbStatus = "review";
          } else if (status === "Approved") {
            dbStatus = "approved";
          } else if (status === "Archived") {
            dbStatus = "archived";
          } else {
            console.warn(`Unknown status: ${status}, defaulting to 'draft'`);
          }
        } catch (err) {
          console.error("Error mapping status:", err);
          // Default to draft if there's an error
          dbStatus = "draft";
        }
        
        // Map the project type to the enum values expected by the database
        let dbProjectType: Database["public"]["Enums"]["project_type"] = "other";
        try {
          if (projectType === "Branding") {
            dbProjectType = "brand_identity";
          } else if (projectType === "Web Design") {
            dbProjectType = "web_design";
          } else if (projectType === "Video Production") {
            dbProjectType = "video";
          } else if (projectType === "Marketing" || projectType === "Social Media") {
            dbProjectType = "campaign";
          } else if (projectType === "Print") {
            dbProjectType = "other";
          } else {
            console.warn(`Unknown project type: ${projectType}, defaulting to 'other'`);
          }
        } catch (err) {
          console.error("Error mapping project type:", err);
          // Default to other if there's an error
          dbProjectType = "other";
        }
        
        // Create a minimal project object with only the required fields
        const projectData = { 
          name: projectName,
          type: dbProjectType,
          status: dbStatus,
        };
        
        // Add optional fields only if they have values
        if (projectDescription) projectData['description'] = projectDescription;
        if (startDate) projectData['start_date'] = startDate;
        if (dueDate) projectData['due_date'] = dueDate;
        
        console.log("Saving project with:", projectData);
        
        try {
          // First, try to create the project without automatically adding the current user
          // as a project member (which might be causing the recursion issue)
          const { data, error } = await supabase
            .from('projects')
            .insert([projectData])
            .select();
            
          if (error) {
            // If there's an error related to project_members policy, try a different approach
            if (error.message && error.message.includes("project_members")) {
              console.log("Detected project_members policy issue, trying alternative approach");
              
              // Try inserting without returning the data
              const insertResult = await supabase
                .from('projects')
                .insert([projectData]);
                
              if (insertResult.error) {
                console.error("Alternative approach also failed:", insertResult.error);
                throw insertResult.error;
              }
              
              // If successful, navigate to projects page
              navigate('/projects');
              return;
            } else {
              // For other errors, throw normally
              console.error("Supabase error details:", error);
              throw error;
            }
          }
          
          // Navigate to the newly created project
          if (data && data[0]) {
            navigate(`/projects/${data[0].id}`);
          } else {
            navigate('/projects');
          }
        } catch (err) {
          console.error("Error in project creation:", err);
          throw err;
        }
      } else {
        // Update existing project
        // Map the status to the enum values expected by the database
        let dbStatus: Database["public"]["Enums"]["project_status"] = "draft";
        
        // Handle status mapping with better error handling
        try {
          if (status === "Not Started") {
            dbStatus = "draft";
          } else if (status === "In Progress") {
            dbStatus = "in_progress";
          } else if (status === "Awaiting Feedback") {
            dbStatus = "review";
          } else if (status === "Approved") {
            dbStatus = "approved";
          } else if (status === "Archived") {
            dbStatus = "archived";
          } else {
            console.warn(`Unknown status: ${status}, defaulting to 'draft'`);
          }
        } catch (err) {
          console.error("Error mapping status:", err);
          // Default to draft if there's an error
          dbStatus = "draft";
        }
        
        // Map the project type to the enum values expected by the database
        let dbProjectType: Database["public"]["Enums"]["project_type"] = "other";
        try {
          if (projectType === "Branding") {
            dbProjectType = "brand_identity";
          } else if (projectType === "Web Design") {
            dbProjectType = "web_design";
          } else if (projectType === "Video Production") {
            dbProjectType = "video";
          } else if (projectType === "Marketing" || projectType === "Social Media") {
            dbProjectType = "campaign";
          } else if (projectType === "Print") {
            dbProjectType = "other";
          } else {
            console.warn(`Unknown project type: ${projectType}, defaulting to 'other'`);
          }
        } catch (err) {
          console.error("Error mapping project type:", err);
          // Default to other if there's an error
          dbProjectType = "other";
        }
        
        // Create a minimal project object with only the required fields
        const projectData = { 
          name: projectName,
          type: dbProjectType,
          status: dbStatus,
        };
        
        // Add optional fields only if they have values
        if (projectDescription) projectData['description'] = projectDescription;
        if (startDate) projectData['start_date'] = startDate;
        if (dueDate) projectData['due_date'] = dueDate;
        
        console.log("Updating project with:", projectData);
        
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', projectId);
          
        if (error) {
          console.error("Supabase update error details:", error);
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      
      // Check for the specific recursion error
      if (error?.message && error.message.includes("infinite recursion detected in policy for relation \"project_members\"")) {
        // This is a known issue with the Supabase policy
        setError("There was an issue with project permissions. The project may have been created but couldn't be displayed. Please check the projects list.");
        
        // Navigate back to projects list after a short delay
        setTimeout(() => {
          navigate('/projects');
        }, 3000);
        
        return;
      }
      
      // Provide more detailed error message for other errors
      let errorMessage = 'Failed to save project. Please try again.';
      
      if (error?.message) {
        errorMessage += ` Error: ${error.message}`;
      }
      
      if (error?.details) {
        errorMessage += ` Details: ${error.details}`;
      }
      
      if (error?.hint) {
        errorMessage += ` Hint: ${error.hint}`;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Render new project form or existing project details
  if (isNewProject) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Create New Project</h1>
              <p className="text-muted-foreground">Fill in the details to create a new project</p>
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
            <Button 
              onClick={handleSaveProject} 
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Project'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input 
                  id="projectName" 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)} 
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="projectDescription">Project Description</Label>
                <Textarea 
                  id="projectDescription" 
                  value={projectDescription} 
                  onChange={(e) => setProjectDescription(e.target.value)} 
                  placeholder="Describe the project"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="clientName">Client</Label>
                <Input 
                  id="clientName" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                  placeholder="Client name"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectType">Project Type</Label>
                <Select value={projectType} onValueChange={setProjectType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Branding">Branding</SelectItem>
                    <SelectItem value="Web Design">Web Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Video Production">Video Production</SelectItem>
                    <SelectItem value="Print">Print</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Awaiting Feedback">Awaiting Feedback</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input 
                    id="dueDate" 
                    type="date" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Existing project view
  return (
    <div className="p-6 max-w-[1600px] mx-auto flex">
      <div className="flex-1">
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold">{projectName}</h1>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                  {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span>Client: {clientName}</span>
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

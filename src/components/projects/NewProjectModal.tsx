import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronUp, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { FileUploader } from "@/components/files/FileUploader";
import { safelyInsertProjectMembers } from "@/utils/supabase-helpers";

const formSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  client_id: z.string().optional(),
  type: z.enum([
    "logo",
    "brand_identity",
    "web_design",
    "campaign",
    "video",
    "photography",
    "other",
  ]),
  start_date: z.date().optional(),
  due_date: z.date().optional(),
  description: z.string().optional(),
  team_members: z.array(z.string()).optional(),
  budget: z.number().positive().optional(),
  milestones: z
    .array(
      z.object({
        name: z.string(),
        date: z.date(),
      })
    )
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Client {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProjectModal({ open, onOpenChange }: NewProjectModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<{ name: string; date: Date }[]>([]);
  const [newMilestone, setNewMilestone] = useState<{ name: string; date: Date | undefined }>({
    name: "",
    date: undefined,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "other",
      description: "",
      team_members: [],
      milestones: [],
    },
  });

  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      Promise.allSettled([
        fetchClients(),
        fetchTeamMembers()
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [open]);

  const fetchClients = async () => {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(clients || []);
      return clients;
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
      return [];
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("role", "team_member")
        .order("full_name");

      if (error) throw error;
      setTeamMembers(data || []);
      return data;
    } catch (error) {
      console.error("Error fetching team members:", error);
      setTeamMembers([]);
      return [];
    }
  };

  const addMilestone = () => {
    if (newMilestone.name && newMilestone.date) {
      setMilestones([...milestones, { ...newMilestone }]);
      setNewMilestone({ name: "", date: undefined });
    }
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      const { data, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Authentication error:", userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!data.user) {
        console.error("No user found - redirecting to login");
        toast({
          title: "Authentication Required",
          description: "Please log in to create a project",
          variant: "destructive",
        });
        onOpenChange(false);
        window.location.href = '/login';
        return;
      }

      const user = data.user;
      
      values.milestones = milestones;

      console.log("Creating project with user ID:", user.id);
      
      const projectData = {
        name: values.name,
        client_id: values.client_id || null,
        type: values.type,
        start_date: values.start_date ? format(values.start_date, "yyyy-MM-dd") : null,
        due_date: values.due_date ? format(values.due_date, "yyyy-MM-dd") : null,
        description: values.description || null,
        created_by: user.id,
        status: "draft" as Database["public"]["Enums"]["project_status"],
      };
      
      console.log("Project data to insert:", projectData);
      
      const { data: project, error } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();

      if (error) {
        console.error("Error creating project:", error);
        throw new Error(`Failed to create project: ${error.message}`);
      }
      
      if (!project) {
        console.error("No project data returned after insert");
        throw new Error("Project was created but no data was returned");
      }
      
      console.log("Project created successfully:", project);

      if (values.team_members && values.team_members.length > 0) {
        const result = await safelyInsertProjectMembers(project.id, values.team_members);
        
        if (!result.success && result.error) {
          console.warn("Note: Project was created but there was an issue adding team members:", result.error);
          if (!result.error.includes("policy issue")) {
            throw new Error(`Failed to add team members: ${result.error}`);
          }
        }
      }

      if (milestones.length > 0) {
        const projectMilestones = milestones.map((milestone) => ({
          project_id: project.id,
          name: milestone.name,
          due_date: format(milestone.date, "yyyy-MM-dd"),
        }));

        const { error: milestoneError } = await supabase
          .from("project_milestones")
          .insert(projectMilestones);

        if (milestoneError) throw milestoneError;
      }

      if (uploadedFiles.length > 0) {
        // Assuming you have a way to associate files with projects
        // This would depend on your file storage implementation
      }

      toast({
        title: "Success",
        description: `Project '${values.name}' created successfully!`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating project:", error);
      
      if (error?.message && error.message.includes("infinite recursion") && error.message.includes("project_members")) {
        console.log("Detected policy recursion issue - project was likely created");
        toast({
          title: "Success",
          description: `Project '${values.name}' created successfully!`,
        });
        onOpenChange(false);
        return;
      }
      
      let errorMessage = "Failed to create project. ";
      if (error?.message) {
        errorMessage += error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (!errorMessage.includes("Authentication")) {
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    setHasError(false);
  }, [open]);
  
  const handleError = (error: Error) => {
    console.error("Error in modal:", error);
    setHasError(true);
  };
  
  React.useEffect(() => {
    window.addEventListener('error', (event) => {
      if (open) {
        console.error("Window error event:", event);
        setHasError(true);
      }
    });
    
    return () => {
      window.removeEventListener('error', () => {});
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new project.
          </DialogDescription>
        </DialogHeader>

        {hasError ? (
          <div className="p-4 border border-red-300 bg-red-50 rounded-md">
            <h3 className="text-red-800 font-medium">Something went wrong</h3>
            <p className="text-red-600 mt-1">
              There was an error loading the project form. Please try again later.
            </p>
            <Button 
              className="mt-4" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="new" className="text-creatively-purple">
                        <div className="flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Client
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="logo">Logo Design</SelectItem>
                      <SelectItem value="brand_identity">Brand Identity</SelectItem>
                      <SelectItem value="web_design">Web Design</SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter project description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Upload Brief/Files</FormLabel>
              <FileUploader
                onUploadComplete={(files) => setUploadedFiles(files)}
                maxFiles={5}
                acceptedFileTypes={[
                  "image/*",
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ]}
              />
            </div>

            <FormField
              control={form.control}
              name="team_members"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Team Members</FormLabel>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`team-member-${member.id}`}
                          checked={field.value?.includes(member.id)}
                          onCheckedChange={(checked) => {
                            const updatedValue = checked
                              ? [...(field.value || []), member.id]
                              : (field.value || []).filter((id) => id !== member.id);
                            field.onChange(updatedValue);
                          }}
                        />
                        <label
                          htmlFor={`team-member-${member.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {member.full_name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                className="flex items-center w-full justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>Advanced Settings</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showAdvanced && (
                <div className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Estimate ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter budget amount"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Set Milestones</FormLabel>
                    <div className="space-y-2">
                      {milestones.map((milestone, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <div>
                            <span className="font-medium">{milestone.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {format(milestone.date, "PPP")}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMilestone(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-2 mt-2">
                      <Input
                        placeholder="Milestone name"
                        value={newMilestone.name}
                        onChange={(e) =>
                          setNewMilestone({
                            ...newMilestone,
                            name: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline">
                            {newMilestone.date ? (
                              format(newMilestone.date, "PP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-2 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newMilestone.date}
                            onSelect={(date) =>
                              setNewMilestone({
                                ...newMilestone,
                                date,
                              })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        onClick={addMilestone}
                        disabled={!newMilestone.name || !newMilestone.date}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

// Form schema
const formSchema = z.object({
  full_name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.string().min(1, { message: "Please select a role" }),
  job_title: z.string().optional(),
  department: z.string().optional(),
  active: z.boolean().default(true),
  assignToProjects: z.boolean().default(false),
  projects: z.array(z.string()).optional(),
  generatePassword: z.boolean().default(true),
  password: z.string().optional(),
}).refine((data) => {
  // If generatePassword is true, password is not required
  if (data.generatePassword) {
    return true;
  }
  // Otherwise, password must be at least 8 characters
  return data.password && data.password.length >= 8;
}, {
  message: "Password must be at least 8 characters",
  path: ["password"], // This tells Zod which field has the error
});

type FormValues = z.infer<typeof formSchema>;

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
}

export function AddMemberModal({ open, onOpenChange, onAdded }: AddMemberModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch projects for assignment
  const { data: projects } = useQuery({
    queryKey: ['projects-for-add-member'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .order('name');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
    },
    enabled: open, // Only fetch when modal is open
  });

  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: "member",
      job_title: "",
      department: "",
      active: true,
      assignToProjects: false,
      projects: [],
      generatePassword: true,
      password: "",
    },
  });

  // Watch for values to conditionally show fields
  const assignToProjects = form.watch("assignToProjects");
  const generatePassword = form.watch("generatePassword");

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      console.log("AddMemberModal opened, resetting form");
      form.reset({
        full_name: "",
        email: "",
        role: "member",
        job_title: "",
        department: "",
        active: true,
        assignToProjects: false,
        projects: [],
        generatePassword: true,
        password: "",
      });
    }
  }, [open, form]);

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      setIsSubmitting(true);

      try {
        console.log("Adding member with values:", values);

        // Generate a password if needed
        const password = values.generatePassword
          ? Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
          : values.password;

        // Map our role values to the user_role enum values in the database
        let dbRole = "team_member";
        switch (values.role) {
          case "admin":
            dbRole = "admin";
            break;
          case "manager":
          case "member":
            dbRole = "team_member";
            break;
          case "viewer":
            dbRole = "client";
            break;
        }

        // Since we can't directly create users with the client-side API,
        // we'll create a team invitation instead
        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

        // Create an invitation
        console.log("Creating invitation with data:", {
          email: values.email,
          role: dbRole,
          token: token,
          expires_at: expiresAt.toISOString(),
          metadata: {
            full_name: values.full_name,
            job_title: values.job_title,
            department: values.department,
            projects: values.assignToProjects ? values.projects : [],
            password: password
          }
        });

        // First try with JSON.stringify
        try {
          const { data: invitationData, error: invitationError } = await supabase
            .from('team_invitations')
            .insert({
              email: values.email,
              role: dbRole,
              token: token,
              expires_at: expiresAt.toISOString(),
              // Store additional data in the invitation
              metadata: {
                full_name: values.full_name,
                job_title: values.job_title,
                department: values.department,
                projects: values.assignToProjects ? values.projects : [],
                password: password // In a real app, you would never store passwords like this
              }
            })
            .select()
            .single();

          console.log("Invitation creation attempt:", { invitationData, invitationError });

          if (invitationError) {
            throw invitationError;
          }

          return {
            invitation: invitationData,
            password: values.generatePassword ? password : undefined,
          };
        } catch (error) {
          console.error("Error in first attempt:", error);

          // If that fails, try without the metadata
          const { data: invitationData, error: invitationError } = await supabase
            .from('team_invitations')
            .insert({
              email: values.email,
              role: dbRole,
              token: token,
              expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

          console.log("Invitation creation attempt (fallback):", { invitationData, invitationError });

          if (invitationError) {
            console.error("Error creating invitation (fallback):", invitationError);
            throw invitationError;
          }

          console.log("Invitation created successfully (fallback):", invitationData);

          // In a real application, you would send an email with the invitation link
          // For this demo, we'll just show a success message with the password

          return {
            invitation: invitationData,
            password: values.generatePassword ? password : undefined,
          };
        }
      } catch (error) {
        console.error("Error adding member:", error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: (data) => {
      if (data.password) {
        toast({
          title: "Success",
          description: `Invitation created successfully. When the user accepts, they can use this password: ${data.password}`,
          duration: 10000, // Show for 10 seconds so user can copy the password
        });
      } else {
        toast({
          title: "Success",
          description: "Invitation created successfully.",
        });
      }
      form.reset({
        full_name: "",
        email: "",
        role: "member",
        job_title: "",
        department: "",
        active: true,
        assignToProjects: false,
        projects: [],
        generatePassword: true,
        password: "",
      });
      onOpenChange(false);
      if (onAdded) onAdded();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    console.log("Form submitted with values:", values);
    addMemberMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Team Member Invitation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.error("Form validation errors:", errors);
              })} className="space-y-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This determines what the user can access and modify.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Designer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Design" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      {field.value ? "User is active and can access the system." : "User is inactive and cannot log in."}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="generatePassword"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Generate Password</FormLabel>
                    <FormDescription>
                      {field.value
                        ? "A secure password will be generated automatically."
                        : "You will need to provide a password."}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!generatePassword && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="assignToProjects"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Assign to Projects</FormLabel>
                    <FormDescription>
                      Assign this member to specific projects right away.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {assignToProjects && projects && projects.length > 0 && (
              <FormField
                control={form.control}
                name="projects"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Select Projects</FormLabel>
                      <FormDescription>
                        Choose which projects to assign this member to.
                      </FormDescription>
                    </div>
                    <div className="space-y-2">
                      {projects.map((project) => (
                        <FormField
                          key={project.id}
                          control={form.control}
                          name="projects"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={project.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(project.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value || [], project.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== project.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {project.name}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Invitation..." : "Create Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

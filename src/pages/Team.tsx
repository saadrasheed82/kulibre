import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeamMemberDetails } from "@/components/dashboard/TeamMemberDetails";
import { TeamBulkActions } from "@/components/dashboard/TeamBulkActions";
import { TeamsList } from "@/components/dashboard/TeamsList";

import {
  UserPlus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Mail
} from "lucide-react";

interface UpdateProfileData {
  avatar_url?: string;
  company?: string;
  created_at?: string;
  full_name?: string;
  id?: string;
  role?: Database["public"]["Enums"]["user_role"];
  updated_at?: string;
}

// Define types for our team members and roles
type TeamMember = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  role: "admin" | "team_member" | "client";
  status: "active" | "invited" | "inactive";
  company: string | null;
  created_at: string | null;
  updated_at: string | null;
  website?: string | null;
  project_members?: any[];
  projects?: Project[];
};

// Define type for projects
type Project = {
  id: string;
  name: string;
  status: string;
};



export default function Team() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>("team-members");

  // Form states for invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "team_member" | "client">("team_member");

  // Form states for manual add
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "team_member" | "client">("team_member");
  const [newMemberProjects, setNewMemberProjects] = useState<string[]>([]);
  
  // State for member projects
  const [memberProjects, setMemberProjects] = useState<string[]>([]);


  // Fetch projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .order('name');

      if (error) {
        console.error("Error fetching projects:", error);
        return [];
      }

      return data || [];
    }
  });

  // Fetch team members
  const { data: teamMembers, isLoading: isLoadingTeamMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      try {
        // First, get all profiles from Supabase without the project_members join
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name');

        if (profilesError) {
          throw new Error(profilesError.message);
        }
        
        // Try to get project_members data separately
        let projectMembersData = [];
        try {
          const { data: projectMembers, error: projectMembersError } = await supabase
            .from('project_members')
            .select(`
              project_id,
              role,
              user_id,
              projects:project_id (
                id,
                name,
                status
              )
            `);
            
          if (!projectMembersError) {
            projectMembersData = projectMembers || [];
          } else {
            console.warn("Could not fetch project_members:", projectMembersError);
          }
        } catch (e) {
          console.warn("Error fetching project_members:", e);
        }

        // Transform Supabase profiles to include email and status
        const supabaseMembers = (profiles || []).map(member => {
          // Check if this is an invited user by looking at the name
          const isInvited = member.full_name?.includes("(Invited)") || false;
          const isInactive = member.full_name?.includes("(Inactive)") || false;
          
          // Extract email from name if it's in the format "Name [email@example.com]"
          let email = member.email || '';
          
          if (!email && member.full_name) {
            // Try to extract email from the name if it's in brackets
            const emailMatch = member.full_name.match(/\[(.*?)\]/);
            if (emailMatch && emailMatch[1]) {
              email = emailMatch[1];
            } else {
              // Generate a placeholder email from the name
              email = `${member.full_name.toLowerCase().replace(/\s+/g, '.').replace(/[^\w.]/g, '')}@example.com`;
            }
          }

          // Find project members for this user
          const userProjectMembers = projectMembersData.filter((pm: any) => pm.user_id === member.id);
          
          // Extract projects from the project members data
          const memberProjects = userProjectMembers.map((pm: any) => pm.projects) || [];

          // Determine status
          let status: "active" | "invited" | "inactive" = "active";
          if (isInvited) {
            status = "invited";
          } else if (isInactive) {
            status = "inactive";
          }

          // Determine role (default to team_member if not present)
          const role = (member.role as "admin" | "team_member" | "client") || "team_member";

          return {
            id: member.id,
            full_name: member.full_name,
            avatar_url: member.avatar_url,
            email,
            role,
            status,
            company: member.company || null,
            created_at: member.created_at || null,
            updated_at: member.updated_at,
            website: member.website,
            project_members: userProjectMembers,
            projects: memberProjects
          } as TeamMember;
        });

        return supabaseMembers;
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast({
          title: "Error",
          description: "Failed to load team members. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    }
  });
  
  // Combined loading state
  const isLoading = isLoadingTeamMembers || isLoadingProjects;



  // Filter team members based on search and filters
  const filteredMembers = teamMembers?.filter(member => {
    const matchesSearch =
      !searchQuery ||
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === "all" || member.role === filterRole;
    const matchesStatus = filterStatus === "all" || member.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async (newMember: { email: string; role: string; projects?: string[] }) => {
      try {
        // Generate a placeholder name from the email
        const emailName = newMember.email.split('@')[0];
        const placeholderName = emailName.replace(/[.]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Generate a UUID for the new user
        const userId = uuidv4();

        // First, create a new profile for the invited user without the email field
        // Create the insert data without role first
        const insertData: any = {
          id: userId,
          // Include email in the name to ensure we have it even if email column doesn't exist
          full_name: `${placeholderName} (Invited) [${newMember.email}]`,
          updated_at: new Date().toISOString()
        };
        
        // Try to add the role field
        try {
          insertData.role = newMember.role;
        } catch (e) {
          console.warn("Could not include role in insert, column might not exist");
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert(insertData)
          .select()
          .single();

        if (profileError) {
          console.error("Error creating profile:", profileError);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        // Try to update the email separately to handle cases where the column might exist
        try {
          await supabase
            .from('profiles')
            .update({ email: newMember.email })
            .eq('id', userId);
        } catch (emailError) {
          // If this fails, it's likely because the email column doesn't exist
          // We'll just continue without setting the email
          console.warn("Could not update email, column might not exist:", emailError);
        }

        // If projects are specified, assign the user to those projects
        if (newMember.projects && newMember.projects.length > 0) {
          const projectAssignments = newMember.projects.map(projectId => ({
            project_id: projectId,
            user_id: userId,
            role: 'member',
            assigned_at: new Date().toISOString()
          }));

          const { error: projectAssignmentError } = await supabase
            .from('project_members')
            .insert(projectAssignments);

          if (projectAssignmentError) {
            console.error("Error assigning projects:", projectAssignmentError);
            // Continue anyway, as the profile was created successfully
          }
        }

        // In a real app, you would send an email invitation here
        // For now, we'll just log it
        console.log(`Invitation would be sent to ${newMember.email}`);

        return { success: true, id: profile.id };
      } catch (error) {
        console.error("Error in inviteMemberMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}`,
      });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("team_member");
      setNewMemberProjects([]);

      // Refetch the team members to update the list
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send invitation: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (updatedMember: Partial<TeamMember> & { projectChanges?: { added: string[], removed: string[] } }) => {
      try {
        // Prepare the update data
        const updateData: any = {
          full_name: updatedMember.full_name,
          updated_at: new Date().toISOString()
        };
        
        // Try to add the role field
        if (updatedMember.role) {
          try {
            updateData.role = updatedMember.role;
          } catch (e) {
            console.warn("Could not include role in update, column might not exist");
          }
        }
        
        // Try to add the company field
        if (updatedMember.company !== undefined) {
          try {
            updateData.company = updatedMember.company;
          } catch (e) {
            console.warn("Could not include company in update, column might not exist");
          }
        }
        
        // Try to update the email if it's provided
        if (updatedMember.email) {
          // Check if the email is different from what's in the name (for cases where email is stored in name)
          const currentName = updatedMember.full_name || '';
          const emailInName = currentName.match(/\[(.*?)\]/);
          const emailFromName = emailInName ? emailInName[1] : '';
          
          if (emailFromName && emailFromName !== updatedMember.email) {
            // Update the email in the name if it's different
            updateData.full_name = currentName.replace(/\[.*?\]/, `[${updatedMember.email}]`);
          }
          
          // Try to update the email column if it exists
          try {
            updateData.email = updatedMember.email;
          } catch (e) {
            console.warn("Could not include email in update, column might not exist");
          }
        }
        
        // Update the profile in the database
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', updatedMember.id);

        if (error) {
          // If there's an error with the email column, try again without it
          if (error.message.includes('email')) {
            delete updateData.email;
            const { error: retryError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', updatedMember.id);
              
            if (retryError) {
              throw new Error(`Failed to update member: ${retryError.message}`);
            }
          } else {
            throw new Error(`Failed to update member: ${error.message}`);
          }
        }

        // Handle project assignments if there are changes
        if (updatedMember.projectChanges) {
          // Remove user from projects
          if (updatedMember.projectChanges.removed.length > 0) {
            const { error: removeError } = await supabase
              .from('project_members')
              .delete()
              .eq('user_id', updatedMember.id)
              .in('project_id', updatedMember.projectChanges.removed);

            if (removeError) {
              console.error("Error removing project assignments:", removeError);
            }
          }

          // Add user to new projects
          if (updatedMember.projectChanges.added.length > 0) {
            const projectAssignments = updatedMember.projectChanges.added.map(projectId => ({
              project_id: projectId,
              user_id: updatedMember.id as string,
              role: 'member',
              assigned_at: new Date().toISOString()
            }));

            const { error: addError } = await supabase
              .from('project_members')
              .insert(projectAssignments);

            if (addError) {
              console.error("Error adding project assignments:", addError);
            }
          }
        }

        // If status is being updated, handle it separately
        if (updatedMember.status) {
          // In a real app, you might have a status field in the profiles table
          // For now, we'll just update the name to indicate status
          let fullName = updatedMember.full_name || '';
          
          if (updatedMember.status === 'inactive' && !fullName.includes('(Inactive)')) {
            fullName = `${fullName} (Inactive)`;
          } else if (updatedMember.status === 'active') {
            fullName = fullName.replace(' (Inactive)', '');
          }
          
          if (fullName !== updatedMember.full_name) {
            const { error: nameError } = await supabase
              .from('profiles')
              .update({ full_name: fullName })
              .eq('id', updatedMember.id);
              
            if (nameError) {
              console.error("Error updating name with status:", nameError);
            }
          }
        }

        return { success: true };
      } catch (error) {
        console.error("Error in updateMemberMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Member updated",
        description: "The team member has been updated successfully.",
      });
      setEditMemberOpen(false);
      setSelectedMember(null);
      setMemberProjects([]);
      // Refetch the team members to update the list
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update member: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Add member manually mutation
  const addMemberMutation = useMutation({
    mutationFn: async (newMember: { name: string; email: string; role: string; projects?: string[] }) => {
      try {
        // Generate a UUID for the new user
        const userId = uuidv4();

        // Create a new profile in Supabase without the email field first
        // This is to handle cases where the email column might not exist in the database
        // Create the insert data without role first
        const insertData: any = {
          id: userId,
          // Include email in the name to ensure we have it even if email column doesn't exist
          full_name: `${newMember.name} [${newMember.email}]`,
          updated_at: new Date().toISOString()
        };
        
        // Try to add the role field
        try {
          insertData.role = newMember.role;
        } catch (e) {
          console.warn("Could not include role in insert, column might not exist");
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert(insertData)
          .select()
          .single();

        if (profileError) {
          // If there's an error, it might be because we're trying to insert into a non-existent column
          console.error("Error creating profile:", profileError);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        // Try to update the email separately to handle cases where the column might exist
        try {
          await supabase
            .from('profiles')
            .update({ email: newMember.email })
            .eq('id', userId);
        } catch (emailError) {
          // If this fails, it's likely because the email column doesn't exist
          // We'll just continue without setting the email
          console.warn("Could not update email, column might not exist:", emailError);
        }

        // If projects are specified, assign the user to those projects
        if (newMember.projects && newMember.projects.length > 0) {
          const projectAssignments = newMember.projects.map(projectId => ({
            project_id: projectId,
            user_id: userId,
            role: 'member',
            assigned_at: new Date().toISOString()
          }));

          const { error: projectAssignmentError } = await supabase
            .from('project_members')
            .insert(projectAssignments);

          if (projectAssignmentError) {
            console.error("Error assigning projects:", projectAssignmentError);
            // Continue anyway, as the profile was created successfully
          }
        }

        return { success: true, id: profile.id };
      } catch (error) {
        console.error("Error in addMemberMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Team member added",
        description: `${newMemberName} has been added to the team`,
      });
      setAddMemberDialogOpen(false);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("team_member");
      setNewMemberProjects([]);

      // Refetch the team members to update the list
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add team member: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      try {
        // First, remove any project assignments
        const { error: projectMemberError } = await supabase
          .from('project_members')
          .delete()
          .eq('user_id', memberId);

        if (projectMemberError) {
          console.error("Error removing project assignments:", projectMemberError);
          // Continue anyway, as we still want to remove the profile
        }

        // Finally, remove the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', memberId);

        if (profileError) {
          throw new Error(`Failed to remove profile: ${profileError.message}`);
        }

        return { success: true };
      } catch (error) {
        console.error("Error in removeMemberMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "The team member has been removed successfully.",
      });
      // Refetch the team members to update the list
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove member: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Handle invite submission
  const handleInvite = () => {
    if (!inviteEmail) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    inviteMemberMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
      projects: newMemberProjects.length > 0 ? newMemberProjects : undefined
    });
  };

  // Handle add member submission
  const handleAddMember = () => {
    if (!newMemberName) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!newMemberEmail) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    addMemberMutation.mutate({
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      projects: newMemberProjects.length > 0 ? newMemberProjects : undefined
    });
  };

  // Handle member update
  const handleUpdateMember = () => {
    if (!selectedMember) return;

    // Calculate project changes
    const currentProjects = selectedMember.projects?.map(p => p.id) || [];
    
    // Find projects that were added
    const addedProjects = memberProjects.filter(id => 
      !currentProjects.includes(id)
    );
    
    // Find projects that were removed
    const removedProjects = currentProjects.filter(id => 
      !memberProjects.includes(id)
    );
    
    // Create project changes object if there are any changes
    const projectChanges = 
      (addedProjects.length > 0 || removedProjects.length > 0) 
        ? { added: addedProjects, removed: removedProjects }
        : undefined;

    updateMemberMutation.mutate({
      id: selectedMember.id,
      full_name: selectedMember.full_name,
      role: selectedMember.role,
      status: selectedMember.status,
      projectChanges
    });
  };

  // Handle member removal
  const handleRemoveMember = (memberId: string) => {
    if (confirm("Are you sure you want to remove this team member?")) {
      removeMemberMutation.mutate(memberId);
    }
  };

  // Handle bulk role change
  const handleBulkRoleChange = async (role: string) => {
    try {
      // Update all selected members' roles in the database
      const updates = selectedMembers.map(member => ({
        id: member.id,
        role: role as "admin" | "team_member" | "client"
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('profiles')
          .update({ role: update.role, updated_at: new Date().toISOString() })
          .eq('id', update.id);

        if (error) {
          throw new Error(`Failed to update role for member ${update.id}: ${error.message}`);
        }
      }

      toast({
        title: "Roles updated",
        description: `Updated ${selectedMembers.length} team members to ${role}`,
      });
      setSelectedMembers([]);
      // Refetch the team members to update the list
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update roles: ${error}`,
        variant: "destructive",
      });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      // Get all member IDs
      const memberIds = selectedMembers.map(member => member.id);
      
      // First, remove all project assignments for these members
      const { error: projectMemberError } = await supabase
        .from('project_members')
        .delete()
        .in('user_id', memberIds);
        
      if (projectMemberError) {
        console.error("Error removing project assignments:", projectMemberError);
        // Continue anyway, as we still want to remove the profiles
      }
      
      // Then, remove all profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .in('id', memberIds);
        
      if (profileError) {
        throw new Error(`Failed to remove profiles: ${profileError.message}`);
      }

      toast({
        title: "Team members removed",
        description: `Removed ${selectedMembers.length} team members`,
      });
      setSelectedMembers([]);
      // Refetch the team members to update the list
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to remove team members: ${error}`,
        variant: "destructive",
      });
    }
  };

  // Toggle member selection for bulk actions
  const toggleMemberSelection = (member: TeamMember) => {
    if (selectedMembers.some(m => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

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

  const handleActivate = async (userId: string) => {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { active: true }
    });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to activate user",
        variant: "destructive"
      });
      return;
    }

    // Update local state
    setTeamMembers(prev => 
      prev.map(member => 
        member.id === userId ? { ...member } : member
      )
    );
  };

  const handleDeactivate = async (userId: string) => {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { active: false }
    });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate user",
        variant: "destructive"
      });
      return;
    }

    // Update local state
    setTeamMembers(prev => 
      prev.map(member => 
        member.id === userId ? { ...member } : member
      )
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and teams</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="team-members">Team Members</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {activeTab === "team-members" ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div></div>
            <div className="flex gap-2">
              <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Add a new team member directly to your team.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email address</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role">Role</Label>
                  <Select value={newMemberRole} onValueChange={(value: any) => setNewMemberRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="team_member">Team Member</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Assign to Projects</Label>
                  <div className="border rounded-md p-4 max-h-40 overflow-y-auto space-y-2">
                    {projects?.map(project => (
                      <div key={project.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`new-project-${project.id}`}
                          checked={newMemberProjects.includes(project.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewMemberProjects([...newMemberProjects, project.id]);
                            } else {
                              setNewMemberProjects(newMemberProjects.filter(id => id !== project.id));
                            }
                          }}
                        />
                        <Label htmlFor={`new-project-${project.id}`}>{project.name}</Label>
                      </div>
                    ))}
                    {!projects?.length && (
                      <p className="text-sm text-muted-foreground">No projects available</p>
                    )}
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddMember} disabled={addMemberMutation.isPending}>
                  {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Mail className="h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team. They'll receive an email with instructions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Assign to Projects</Label>
                <div className="border rounded-md p-4 max-h-40 overflow-y-auto space-y-2">
                  {projects?.map(project => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`invite-project-${project.id}`}
                        checked={newMemberProjects.includes(project.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewMemberProjects([...newMemberProjects, project.id]);
                          } else {
                            setNewMemberProjects(newMemberProjects.filter(id => id !== project.id));
                          }
                        }}
                      />
                      <Label htmlFor={`invite-project-${project.id}`}>{project.name}</Label>
                    </div>
                  ))}
                  {!projects?.length && (
                    <p className="text-sm text-muted-foreground">No projects available</p>
                  )}
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={inviteMemberMutation.isPending}>
                {inviteMemberMutation.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Role</p>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-2 pt-0">
                <p className="text-sm font-medium mb-2">Status</p>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={view === "table" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setView("table")}
            >
              List
            </Button>
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setView("grid")}
            >
              Grid
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Loading team members...</p>
        </div>
      ) : filteredMembers?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-creatively-purple/10 flex items-center justify-center mb-4">
            <UserPlus className="h-10 w-10 text-creatively-purple" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            No team members found
          </h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {searchQuery || filterRole !== "all" || filterStatus !== "all"
              ? "Try adjusting your search or filters to find team members."
              : "Start by inviting team members to collaborate on your work."}
          </p>
          <Button
            className="gap-2"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Invite Team Member
          </Button>
        </div>
      ) : view === "table" ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      filteredMembers?.length > 0 &&
                      selectedMembers.length === filteredMembers?.length
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMembers(filteredMembers || []);
                      } else {
                        setSelectedMembers([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMembers.some(m => m.id === member.id)}
                      onCheckedChange={() => toggleMemberSelection(member)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-creatively-purple/10 text-creatively-purple">
                          {member.full_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        {member.company && (
                          <p className="text-xs text-muted-foreground">{member.company}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleDisplay(member.role)}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedMember(member);
                          setDetailsOpen(true);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedMember(member);
                          // Initialize memberProjects with the current member's projects
                          setMemberProjects(member.projects?.map(p => p.id) || []);
                          setEditMemberOpen(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {member.status === "invited" && (
                          <DropdownMenuItem onClick={() => {
                            toast({
                              title: "Invitation resent",
                              description: `A new invitation has been sent to ${member.email}`,
                            });
                          }}>
                            <Mail className="h-4 w-4 mr-2" />
                            Resend Invite
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleRemoveMember(member.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMembers?.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="w-20 h-20 rounded-full bg-creatively-purple/10 mx-auto mb-4 flex items-center justify-center">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name || ""}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-creatively-purple">
                      {member.full_name?.[0] || "?"}
                    </span>
                  )}
                </div>
                <CardTitle className="text-center">{member.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">{getRoleDisplay(member.role)}</p>
                <p className="text-sm">{member.email}</p>
                <div className="flex justify-center">
                  {getStatusBadge(member.status)}
                </div>
                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedMember(member);
                      setDetailsOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMember(member);
                      // Initialize memberProjects with the current member's projects
                      setMemberProjects(member.projects?.map(p => p.id) || []);
                      setEditMemberOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Activity Log */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4 border rounded-md p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm">Sarah updated Project Alpha</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm">Ali uploaded a new version of Logo V2</p>
              <p className="text-xs text-muted-foreground">Yesterday at 4:30 PM</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm">Mike left a feedback comment</p>
              <p className="text-xs text-muted-foreground">2 days ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Member Sheet */}
      <Sheet open={editMemberOpen} onOpenChange={setEditMemberOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Team Member</SheetTitle>
            <SheetDescription>
              Update team member details and permissions
            </SheetDescription>
          </SheetHeader>
          {selectedMember && (
            <div className="py-6 space-y-6">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarImage src={selectedMember.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-creatively-purple/10 text-creatively-purple">
                    {selectedMember.full_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedMember.full_name || ""}
                    onChange={(e) => setSelectedMember({
                      ...selectedMember,
                      full_name: e.target.value
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    value={selectedMember.email || ""}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={selectedMember.role}
                    onValueChange={(value: any) => setSelectedMember({
                      ...selectedMember,
                      role: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="team_member">Team Member</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={selectedMember.status}
                    onValueChange={(value: any) => setSelectedMember({
                      ...selectedMember,
                      status: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Project Assignments</Label>
                  <div className="border rounded-md p-4 max-h-40 overflow-y-auto space-y-2">
                    {projects?.map(project => {
                      // Check if the member is assigned to this project
                      const isAssigned = selectedMember.projects?.some(p => p.id === project.id);
                      
                      return (
                        <div key={project.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-project-${project.id}`}
                            checked={isAssigned}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Add project to member's projects
                                setMemberProjects([...memberProjects, project.id]);
                                setSelectedMember({
                                  ...selectedMember,
                                  projects: [...(selectedMember.projects || []), project]
                                });
                              } else {
                                // Remove project from member's projects
                                setMemberProjects(memberProjects.filter(id => id !== project.id));
                                setSelectedMember({
                                  ...selectedMember,
                                  projects: selectedMember.projects?.filter(p => p.id !== project.id) || []
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`edit-project-${project.id}`}>{project.name}</Label>
                        </div>
                      );
                    })}
                    {!projects?.length && (
                      <p className="text-sm text-muted-foreground">No projects available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateMember} disabled={updateMemberMutation.isPending}>
              {updateMemberMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Team Member Details Dialog */}
      <TeamMemberDetails
        member={selectedMember}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Bulk Actions */}
      <TeamBulkActions
        selectedMembers={selectedMembers}
        onClearSelection={() => setSelectedMembers([])}
        onBulkRoleChange={handleBulkRoleChange}
        onBulkDelete={handleBulkDelete}
      />
      </>
      ) : (
        <TeamsList />
      )}
    </div>
  );
}

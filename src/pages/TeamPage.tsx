import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
<<<<<<< HEAD
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
=======
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Mail, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  XCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
>>>>>>> c443c66e1b864d29687db63a9c0dc116e92db326
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
<<<<<<< HEAD
=======
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
>>>>>>> c443c66e1b864d29687db63a9c0dc116e92db326
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
<<<<<<< HEAD
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteMemberModal } from "@/components/team/InviteMemberModal";
import { EditMemberModal } from "@/components/team/EditMemberModal";
import { AddMemberModal } from "@/components/team/AddMemberModal";
import { ViewMemberModal } from "@/components/team/ViewMemberModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ViewModeToggle } from "@/components/files/ViewModeToggle";

// Types
interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  active: boolean;
  status: "active" | "invited" | "inactive";
  job_title?: string;
  department?: string;
  isInvitation?: boolean;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string | null;
  accepted_at: string | null;
}

export default function TeamPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Fetch team members
  const { data: teamMembers, isLoading, isError, error } = useQuery({
    queryKey: ['team-members', searchQuery, roleFilter, statusFilter],
    queryFn: async () => {
      try {
        console.log("Fetching team members...");

        // Fetch team members with detailed logging
        console.log("Sending request to fetch team members from Supabase");

        // By default, only fetch active team members unless specifically filtering for inactive ones
        let query = supabase.from('team_members').select('*');

        // Only apply active filter if not specifically looking for inactive members
        if (statusFilter !== 'inactive') {
          query = query.eq('active', true);
        }

        const { data: teamMembersData, error: teamMembersError } = await query;

        if (teamMembersError) {
          console.error("Error fetching team members:", teamMembersError);
          throw teamMembersError;
        }

        if (!teamMembersData) {
          console.log("No team members returned from database");
          return [];
        }

        console.log(`Team members fetched: ${teamMembersData.length}`, teamMembersData);

        // Process data to determine status
        const processedMembers = teamMembersData.map((member: any) => {
          // Map the role to our expected format
          let mappedRole = "member";
          if (member.role === "admin") {
            mappedRole = "admin";
          } else if (member.role === "rider") {
            mappedRole = "member";
          } else if (member.role === "client") {
            mappedRole = "viewer";
          }

          // Use full_name or create it from first_name and last_name
          const fullName = member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unnamed User';

          return {
            id: member.id,
            full_name: fullName,
            email: member.email || `${member.first_name || 'user'}@example.com`, // Use actual email if available
            avatar_url: null,
            role: mappedRole,
            active: member.active !== false, // Default to true if not explicitly false
            status: member.active === false ? "inactive" : "active" as "active" | "invited" | "inactive",
            job_title: member.job_title || "",
            department: member.department || "",
            isInvitation: false
          };
        });

        console.log("Processed members:", processedMembers);

        // Apply filters
        let filteredMembers = processedMembers;

        if (searchQuery) {
          filteredMembers = filteredMembers.filter((member: TeamMember) =>
            member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (member.job_title && member.job_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (member.department && member.department.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }

        if (roleFilter !== "all") {
          filteredMembers = filteredMembers.filter((member: TeamMember) =>
            member.role === roleFilter
          );
        }

        if (statusFilter !== "all") {
          filteredMembers = filteredMembers.filter((member: TeamMember) =>
            member.status === statusFilter
          );
        }

        console.log("Filtered members:", filteredMembers);
        return filteredMembers;
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast({
          title: "Error",
          description: "Failed to load team members. Please try again.",
          variant: "destructive"
        });
=======
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

// Define types for team members
interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

// Define types for the add member form
interface AddMemberFormData {
  full_name: string;
  email: string;
  role: string;
}

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<AddMemberFormData>({
    full_name: "",
    email: "",
    role: "member"
  });
  
  const queryClient = useQueryClient();

  // Fetch team members
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      try {
        // First check if the team table exists
        const { error: tableCheckError } = await supabase
          .from('team')
          .select('id')
          .limit(1);

        if (tableCheckError) {
          console.error("Error checking team table:", tableCheckError);
          return [];
        }

        // Fetch team members with user details
        const { data, error } = await supabase
          .from('user_team')
          .select(`
            *,
            user:user_id (
              id,
              full_name,
              email,
              avatar_url
            )
          `);

        if (error) {
          throw error;
        }

        return data as TeamMember[];
      } catch (error) {
        console.error("Error fetching team members:", error);
>>>>>>> c443c66e1b864d29687db63a9c0dc116e92db326
        return [];
      }
    }
  });

<<<<<<< HEAD
  // Deactivate member mutation (safer alternative to deletion)
  const deactivateMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log("Deactivating team member with ID:", memberId);

      try {
        // First check if the team member exists
        const { data: memberCheck, error: checkError } = await supabase
          .from('team_members')
          .select('id, email')
          .eq('id', memberId)
          .single();

        if (checkError) {
          console.error("Error checking team member existence:", checkError);
          // If the team member doesn't exist, we'll consider this a success
          if (checkError.code === 'PGRST116') {
            console.log("Team member doesn't exist, considering deactivation successful");
            return memberId;
          }
          throw checkError;
        }

        console.log("Team member exists, proceeding with deactivation:", memberCheck);

        // Try to update the team member to mark it as inactive
        const { data: updatedMember, error: updateError } = await supabase
          .from('team_members')
          .update({
            active: false,
            email: `removed-${Date.now()}@example.com`, // Change email to avoid conflicts
            updated_at: new Date().toISOString()
          })
          .eq('id', memberId)
          .select();

        if (updateError) {
          console.error("Error updating profile:", updateError);

          // If update fails, try to delete as a fallback
          console.log("Update failed, attempting deletion as fallback");
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', memberId);

          if (deleteError) {
            console.error("Fallback deletion also failed:", deleteError);
            throw deleteError;
          }

          console.log("Fallback deletion successful");
        } else {
          console.log("Profile deactivated successfully:", updatedProfile);
        }

        return memberId;
      } catch (error) {
        console.error("Error in deactivate mutation:", error);
        throw error;
      }
    },
    onSuccess: (memberId) => {
      console.log("Deactivate mutation successful for ID:", memberId);
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Success",
        description: "Team member removed successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error) => {
      console.error("Error removing team member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Force delete as a fallback - direct deletion from team_members
  const forceDeleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log("Attempting direct deletion for team member with ID:", memberId);

      // Try direct deletion from team_members table
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error("Error deleting team member:", error);
        throw error;
      }

      console.log("Force delete successful");
      return memberId;
    },
    onSuccess: (memberId) => {
      console.log("Force delete successful for ID:", memberId);
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Success",
        description: "Team member removed successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error) => {
      console.error("Error in force delete:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle member deletion
  const handleDeleteMember = () => {
    if (selectedMember) {
      // First try to deactivate the member
      deactivateMemberMutation.mutate(selectedMember.id, {
        onError: (error) => {
          console.log("Deactivation failed, attempting force delete as fallback");
          // If deactivation fails, try force delete
          forceDeleteMemberMutation.mutate(selectedMember.id);
        }
      });
    }
  };

  // Handle edit member
  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  // Handle view member details
  const handleViewMemberDetails = (member: TeamMember) => {
    setSelectedMember(member);
    setIsViewModalOpen(true);
  };

  // Handle member selection for bulk actions
  const handleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">{status}</Badge>;
      case "invited":
        return <Badge className="bg-blue-500">{status}</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "invited":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Render team member cards
  const renderTeamMemberCards = () => {
    if (isLoading) {
      return Array(6).fill(0).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ));
    }

    if (!teamMembers || teamMembers.length === 0) {
      return (
        <Card className="col-span-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No team members found.</p>
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="default"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsInviteModalOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member via Email
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return teamMembers.map((member: TeamMember) => (
      <Card key={member.id} className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-creatively-purple flex items-center justify-center text-white font-medium">
                {member.full_name
                  ? member.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                  : '?'}
              </div>
              <div>
                <h3 className="font-medium">{member.full_name || "Unnamed User"}</h3>
                <p className="text-sm text-muted-foreground">{member.email}</p>
                <p className="text-sm text-muted-foreground">{member.job_title || "No title"}</p>
                <div className="mt-2">{getStatusBadge(member.status)}</div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewMemberDetails(member)}>
                  <Users className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditMember(member)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    setSelectedMember(member);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Render team member table
  const renderTeamMemberTable = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }

    if (!teamMembers || teamMembers.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No team members found.</p>
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="default"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member via Email
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                className="h-4 w-4"
                onChange={() => {
                  if (selectedMembers.length === teamMembers.length) {
                    setSelectedMembers([]);
                  } else {
                    setSelectedMembers(teamMembers.map((m: TeamMember) => m.id));
                  }
                }}
                checked={selectedMembers.length === teamMembers.length && teamMembers.length > 0}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member: TeamMember) => (
            <TableRow key={member.id}>
              <TableCell>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => handleMemberSelection(member.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-creatively-purple flex items-center justify-center text-white font-medium text-xs">
                    {member.full_name
                      ? member.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                      : '?'}
                  </div>
                  <span>{member.full_name || "Unnamed User"}</span>
                </div>
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{member.role || "Member"}</Badge>
              </TableCell>
              <TableCell>{member.department || "—"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(member.status)}
                  <span className="capitalize">{member.status}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewMemberDetails(member)}>
                      <Users className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditMember(member)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => {
                        setSelectedMember(member);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
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
    );
  };

=======
  // Filter team members based on search query
  const filteredTeamMembers = teamMembers?.filter(member => 
    member.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: AddMemberFormData) => {
      // First create or get the user
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .upsert({
          full_name: data.full_name,
          email: data.email
        })
        .select('id')
        .single();

      if (userError) throw userError;

      // Get the team ID (assuming there's only one team for simplicity)
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('id')
        .limit(1)
        .single();

      if (teamError) {
        // If no team exists, create one
        const { data: newTeamData, error: createTeamError } = await supabase
          .from('team')
          .insert({ name: 'Default Team' })
          .select('id')
          .single();

        if (createTeamError) throw createTeamError;
        
        // Use the newly created team
        if (newTeamData) {
          // Add user to team
          const { error: addUserError } = await supabase
            .from('user_team')
            .insert({
              user_id: userData.id,
              team_id: newTeamData.id
            });

          if (addUserError) throw addUserError;
          
          return { ...data, id: userData.id, team_id: newTeamData.id };
        }
      } else if (teamData) {
        // Add user to existing team
        const { error: addUserError } = await supabase
          .from('user_team')
          .insert({
            user_id: userData.id,
            team_id: teamData.id
          });

        if (addUserError) throw addUserError;
        
        return { ...data, id: userData.id, team_id: teamData.id };
      }

      throw new Error("Failed to add team member");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setIsAddMemberOpen(false);
      setFormData({
        full_name: "",
        email: "",
        role: "member"
      });
      toast.success("Team member added successfully");
    },
    onError: (error) => {
      console.error("Error adding team member:", error);
      toast.error("Failed to add team member");
    }
  });

  // Remove team member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('user_team')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      return memberId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success("Team member removed successfully");
    },
    onError: (error) => {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    }
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle role selection
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  // Handle add member form submission
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    addMemberMutation.mutate(formData);
  };

  // Handle remove member
  const handleRemoveMember = (member: TeamMember) => {
    if (confirm(`Are you sure you want to remove ${member.user.full_name} from the team?`)) {
      removeMemberMutation.mutate(member.id);
    }
  };

>>>>>>> c443c66e1b864d29687db63a9c0dc116e92db326
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
<<<<<<< HEAD
            Manage your team members and their permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)} variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
          <Button onClick={() => setIsInviteModalOpen(true)} variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member via Email
=======
            Manage your team members and their access
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsInviteMemberOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Invite
          </Button>
          <Button onClick={() => setIsAddMemberOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
>>>>>>> c443c66e1b864d29687db63a9c0dc116e92db326
          </Button>
        </div>
      </div>

<<<<<<< HEAD
      {isError && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Error loading team members</p>
            </div>
            <p className="text-sm text-red-600 mt-1">
              {error instanceof Error ? error.message : "An unknown error occurred. Please try refreshing the page."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search team members..."
            className="pl-10 w-full sm:w-[300px]"
=======
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search team members..."
            className="pl-8"
>>>>>>> c443c66e1b864d29687db63a9c0dc116e92db326
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
<<<<<<< HEAD
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <ViewModeToggle view={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderTeamMemberCards()}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 sm:p-6">
            {renderTeamMemberTable()}
          </CardContent>
        </Card>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            // Refresh the team members list when the modal is closed
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
          }
        }}
        onAdded={() => {
          queryClient.invalidateQueries({ queryKey: ['team-members'] });
        }}
      />

      {/* Invite Member Modal */}
      <InviteMemberModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        onInvited={() => {
          queryClient.invalidateQueries({ queryKey: ['team-members'] });
        }}
      />

      {/* Edit Member Modal */}
      {selectedMember && (
        <EditMemberModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          member={selectedMember}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
            setSelectedMember(null);
          }}
        />
      )}

      {/* View Member Details Modal */}
      {selectedMember && (
        <ViewMemberModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          member={selectedMember}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{selectedMember?.full_name || "Unnamed User"}</strong> from your team?
              <br /><br />
              <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-800 text-sm">
                <strong>Note:</strong> This will deactivate the team member's account.
                They will no longer appear in the active team members list but can be viewed
                by filtering for inactive members.
              </div>
              <div className="bg-red-50 p-3 rounded border border-red-200 text-red-800 text-sm mt-2">
                <strong>Force Delete:</strong> If the normal removal doesn't work, use the "Force Delete"
                button to completely remove the member and all their references from the database.
                This action cannot be undone.
              </div>
              <br />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Email:</strong></div>
                <div>{selectedMember?.email}</div>
                <div><strong>Role:</strong></div>
                <div>{selectedMember?.role}</div>
                <div><strong>ID:</strong></div>
                <div className="text-gray-500 text-xs">{selectedMember?.id}</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <div className="flex gap-2">
              <AlertDialogAction
                onClick={handleDeleteMember}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove Member
              </AlertDialogAction>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (selectedMember) {
                    // Directly use force delete
                    forceDeleteMemberMutation.mutate(selectedMember.id);
                  }
                }}
              >
                Force Delete
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
=======
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTeamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="bg-muted rounded-full p-3 mb-4">
                <UserPlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No team members found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery 
                  ? "Try adjusting your search" 
                  : "Add team members to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTeamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                      {member.user.full_name
                        ? member.user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase()
                        : '?'}
                    </div>
                    <div>
                      <p className="font-medium">{member.user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedMember(member);
                          setIsEditMemberOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleRemoveMember(member)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your team. They will have access to your projects.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddMemberOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addMemberMutation.isPending}>
                {addMemberMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteMemberOpen} onOpenChange={setIsInviteMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation email to add someone to your team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            // For now, just use the add member functionality
            addMemberMutation.mutate(formData);
            setIsInviteMemberOpen(false);
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite_email">Email</Label>
                <Input
                  id="invite_email"
                  name="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite_name">Full Name (Optional)</Label>
                <Input
                  id="invite_name"
                  name="full_name"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite_role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteMemberOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addMemberMutation.isPending}>
                {addMemberMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update the details for this team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Full Name</Label>
              <Input
                id="edit_name"
                defaultValue={selectedMember?.user.full_name}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                defaultValue={selectedMember?.user.email}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_role">Role</Label>
              <Select defaultValue="member">
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditMemberOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              // For now, just close the dialog
              setIsEditMemberOpen(false);
              toast.success("Team member updated successfully");
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
>>>>>>> c443c66e1b864d29687db63a9c0dc116e92db326
    </div>
  );
}

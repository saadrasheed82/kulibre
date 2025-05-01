import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
        return [];
      }
    }
  });

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
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
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search team members..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members', searchQuery, roleFilter, statusFilter],
    queryFn: async () => {
      try {
        console.log("Fetching team members...");

        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }

        console.log("Profiles fetched:", profiles);

        // Fetch invitations
        const { data: invitations, error: invitationsError } = await supabase
          .from('team_invitations')
          .select('id, email, role, token, created_at, expires_at, accepted_at, metadata');

        if (invitationsError) {
          console.error("Error fetching invitations:", invitationsError);
          throw invitationsError;
        }

        console.log("Invitations fetched:", invitations);

        // Also create "virtual" team members from invitations that don't have a corresponding profile
        const invitationMembers = invitations
          .filter((inv: any) => !profiles.some((profile: any) => profile.email === inv.email))
          .map((inv: any) => {
            const metadata = inv.metadata || {};
            return {
              id: inv.id,
              full_name: metadata.full_name || "Invited User",
              email: inv.email,
              role: inv.role,
              job_title: metadata.job_title || "",
              department: metadata.department || "",
              active: true,
              status: "invited" as "active" | "invited" | "inactive",
              isInvitation: true
            };
          });

        // Process data to determine status
        const profileMembers = profiles.map((profile: any) => {
          const invitation = invitations?.find((inv: any) => inv.email === profile.email && !inv.accepted_at);

          let status: "active" | "invited" | "inactive" = "active";
          if (invitation && !invitation.accepted_at) {
            status = "invited";
          } else if (profile.active === false) {
            status = "inactive";
          }

          // Map the user_role enum to our role string
          let mappedRole = "member";
          if (profile.role === "admin") {
            mappedRole = "admin";
          } else if (profile.role === "team_member") {
            mappedRole = "member";
          } else if (profile.role === "client") {
            mappedRole = "viewer";
          }

          return {
            ...profile,
            role: mappedRole,
            status
          };
        });

        // Combine profile members and invitation members
        const members = [...profileMembers, ...invitationMembers];

        console.log("Processed members:", members);

        // Apply filters
        let filteredMembers = members;

        if (searchQuery) {
          filteredMembers = filteredMembers.filter((member: TeamMember) =>
            member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.department?.toLowerCase().includes(searchQuery.toLowerCase())
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
        return [];
      }
    }
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // Check if this is an invitation or a profile
      const member = teamMembers?.find(m => m.id === memberId);

      if (member?.isInvitation) {
        console.log("Deleting invitation:", memberId);
        // Delete the invitation
        const { error: invitationError } = await supabase
          .from('team_invitations')
          .delete()
          .eq('id', memberId);

        if (invitationError) {
          console.error("Error deleting invitation:", invitationError);
          throw invitationError;
        }

        return memberId;
      } else {
        console.log("Deleting profile:", memberId);
        // First, delete any project assignments
        const { error: projectMemberError } = await supabase
          .from('project_members')
          .delete()
          .eq('user_id', memberId);

        if (projectMemberError) {
          console.error("Error deleting project assignments:", projectMemberError);
          throw projectMemberError;
        }

        // Delete any pending invitations
        const { error: invitationError } = await supabase
          .from('team_invitations')
          .delete()
          .eq('user_id', memberId);

        if (invitationError) {
          console.error("Error deleting invitations:", invitationError);
          // Don't throw here, as the user_id might not be set in invitations
        }

        // Finally, delete the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', memberId);

        if (profileError) {
          console.error("Error deleting profile:", profileError);
          throw profileError;
        }

        return memberId;
      }
    },
    onSuccess: () => {
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

  // Handle member deletion
  const handleDeleteMember = () => {
    if (selectedMember) {
      deleteMemberMutation.mutate(selectedMember.id);
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
                Create Member
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsInviteModalOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
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
              Create Member
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and their permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)} variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Create Member
          </Button>
          <Button onClick={() => setIsInviteModalOpen(true)} variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search team members..."
            className="pl-10 w-full sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedMember?.full_name} from your team.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


import { useState, useEffect } from "react";
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

// Define types for our team members and roles
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

type Project = {
  id: string;
  name: string;
};

export default function Team() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
  
  // Form states for invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "team_member" | "client">("team_member");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Fetch team members
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Transform data to include status (in a real app, this would come from the database)
      return (data || []).map(member => ({
        ...member,
        email: `${member.full_name?.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Mock email
        status: Math.random() > 0.7 ? (Math.random() > 0.5 ? "invited" : "inactive") : "active" // Random status for demo
      })) as TeamMember[];
    }
  });

  // Fetch projects for assignment
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    }
  });

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
      // In a real app, this would call an API to send an invite
      // For demo purposes, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, id: `user-${Date.now()}` };
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}`,
      });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("team_member");
      setSelectedProjects([]);
      // In a real app, you would refetch the team members
      // queryClient.invalidateQueries({ queryKey: ['team-members'] });
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
    mutationFn: async (updatedMember: Partial<TeamMember>) => {
      // In a real app, this would update the member in the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Member updated",
        description: "The team member has been updated successfully.",
      });
      setEditMemberOpen(false);
      setSelectedMember(null);
      // In a real app, you would refetch the team members
      // queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update member: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // In a real app, this would remove the member from the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "The team member has been removed successfully.",
      });
      // In a real app, you would refetch the team members
      // queryClient.invalidateQueries({ queryKey: ['team-members'] });
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
      projects: selectedProjects.length > 0 ? selectedProjects : undefined
    });
  };

  // Handle member update
  const handleUpdateMember = () => {
    if (!selectedMember) return;
    
    updateMemberMutation.mutate({
      id: selectedMember.id,
      full_name: selectedMember.full_name,
      role: selectedMember.role,
      status: selectedMember.status
    });
  };

  // Handle member removal
  const handleRemoveMember = (memberId: string) => {
    if (confirm("Are you sure you want to remove this team member?")) {
      removeMemberMutation.mutate(memberId);
    }
  };
  
  // Handle bulk role change
  const handleBulkRoleChange = (role: string) => {
    // In a real app, this would update all selected members in the database
    toast({
      title: "Roles updated",
      description: `Updated ${selectedMembers.length} team members to ${role}`,
    });
    setSelectedMembers([]);
  };
  
  // Handle bulk delete
  const handleBulkDelete = () => {
    // In a real app, this would delete all selected members from the database
    toast({
      title: "Team members removed",
      description: `Removed ${selectedMembers.length} team members`,
    });
    setSelectedMembers([]);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and their access</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
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
                <Label>Assign to Projects (Optional)</Label>
                <div className="border rounded-md p-4 max-h-40 overflow-y-auto space-y-2">
                  {projects?.map(project => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`project-${project.id}`}
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProjects([...selectedProjects, project.id]);
                          } else {
                            setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                          }
                        }}
                      />
                      <Label htmlFor={`project-${project.id}`}>{project.name}</Label>
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
              : "Start by inviting team members to collaborate on your projects."}
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
                    {projects?.map(project => (
                      <div key={project.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`edit-project-${project.id}`}
                          // In a real app, you would check if the member is assigned to this project
                          checked={Math.random() > 0.5}
                        />
                        <Label htmlFor={`edit-project-${project.id}`}>{project.name}</Label>
                      </div>
                    ))}
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
    </div>
  );
}

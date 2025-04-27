import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, ChevronDown, Trash2, UserCog } from "lucide-react";

type TeamMember = {
  id: string;
  full_name: string | null;
};

interface TeamBulkActionsProps {
  selectedMembers: TeamMember[];
  onClearSelection: () => void;
  onBulkRoleChange: (role: string) => void;
  onBulkDelete: () => void;
}

export function TeamBulkActions({
  selectedMembers,
  onClearSelection,
  onBulkRoleChange,
  onBulkDelete,
}: TeamBulkActionsProps) {
  const { toast } = useToast();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const handleRoleChange = () => {
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }

    onBulkRoleChange(selectedRole);
    setRoleDialogOpen(false);
    setSelectedRole("");
    
    toast({
      title: "Roles updated",
      description: `Updated ${selectedMembers.length} team members to ${selectedRole}`,
    });
  };

  const handleDelete = () => {
    onBulkDelete();
    setConfirmDeleteOpen(false);
    
    toast({
      title: "Team members removed",
      description: `Removed ${selectedMembers.length} team members`,
    });
  };

  if (selectedMembers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background border shadow-lg rounded-lg p-4 z-50 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-creatively-purple" />
          <span className="font-medium">
            {selectedMembers.length} {selectedMembers.length === 1 ? "member" : "members"} selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClearSelection}>
            Clear
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                Bulk Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setRoleDialogOpen(true)}>
                <UserCog className="h-4 w-4 mr-2" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Members
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Members</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMembers.length} team {selectedMembers.length === 1 ? "member" : "members"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Team Member Roles</DialogTitle>
            <DialogDescription>
              Select a new role for the {selectedMembers.length} selected team {selectedMembers.length === 1 ? "member" : "members"}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>
              Update Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited?: () => void;
}

export function InviteMemberModal({ open, onOpenChange, onInvited }: InviteMemberModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  console.log("InviteMemberModal rendered with open state:", open);

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async () => {
      console.log("Starting invitation mutation with values:", { email, role });
      setIsSubmitting(true);

      try {
        // Generate a unique token for the invitation
        const token = uuidv4();
        console.log("Generated token:", token);

        // Set expiration date (7 days from now)
        const expiresAt = addDays(new Date(), 7).toISOString();
        console.log("Expiration date:", expiresAt);

        // Map our role values to the user_role enum values in the database
        let dbRole = "member";
        switch (role) {
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
        console.log("Mapped role:", dbRole);

        // Create invitation record
        console.log("Creating invitation record with data:", {
          email,
          role: dbRole,
          token,
          expires_at: expiresAt,
        });

        const { data: invitation, error: invitationError } = await supabase
          .from('team_invitations')
          .insert({
            email,
            role: dbRole,
            token,
            expires_at: expiresAt,
          })
          .select()
          .single();

        console.log("Supabase response:", { invitation, invitationError });

        if (invitationError) {
          console.error("Error creating invitation:", invitationError);
          throw invitationError;
        }

        console.log("Invitation created successfully:", invitation);
        return invitation;
      } catch (error) {
        console.error("Error inviting member:", error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation sent successfully.",
      });
      setEmail("");
      setRole("member");
      onOpenChange(false);
      if (onInvited) onInvited();
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with values:", { email, role });

    // Simple validation
    if (!email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    inviteMemberMutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        console.log("Dialog open state changing to:", newOpen);
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              An invitation will be sent to this email address.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={setRole}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This determines what the user can access and modify.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

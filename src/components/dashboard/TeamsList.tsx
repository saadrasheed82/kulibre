import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users } from "lucide-react";

// Define types for our team and team members
type Team = {
  id: string;
  name: string;
  created_at: string;
};

type TeamMember = {
  team_id: string;
  user_id: string;
  role: string;
  created_at?: string; // Changed from joined_at to created_at
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
};

export function TeamsList() {
  const [activeTab, setActiveTab] = useState<string>("all-teams");

  // Fetch teams
  const { data: teams, isLoading: isLoadingTeams, error: teamsError } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      try {
        // First check if the teams table exists
        const { data: tableExists, error: tableCheckError } = await supabase
          .from('teams')
          .select('*')
          .limit(1);
          
        if (tableCheckError) {
          console.error("Error checking teams table:", tableCheckError);
          throw new Error(`Table check error: ${tableCheckError.message}`);
        }
        
        // If we get here, the table exists, so proceed with the full query
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('name');
          
        console.log("Teams data:", data);

        if (error) {
          console.error("Error fetching teams:", error);
          throw new Error(`Query error: ${error.message}`);
        }

        return data as Team[] || [];
      } catch (err) {
        console.error("Exception in teams query:", err);
        throw err;
      }
    }
  });

  // Fetch team members with profiles
  const { data: teamMembers, isLoading: isLoadingTeamMembers, error: teamMembersError } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      try {
        // First check if the team_members table exists
        const { data: tableExists, error: tableCheckError } = await supabase
          .from('team_members')
          .select('*')
          .limit(1);
          
        if (tableCheckError) {
          console.error("Error checking team_members table:", tableCheckError);
          throw new Error(`Table check error: ${tableCheckError.message}`);
        }
        
        // If we get here, the table exists, so proceed with the full query
        const { data, error } = await supabase
          .from('team_members')
          .select(`
            *,
            profile:user_id (
              id,
              full_name,
              avatar_url,
              email
            )
          `)
          .order('role');
          
        console.log("Team members data:", data);

        if (error) {
          console.error("Error fetching team members:", error);
          throw new Error(`Query error: ${error.message}`);
        }

        return data as TeamMember[] || [];
      } catch (err) {
        console.error("Exception in team members query:", err);
        throw err;
      }
    }
  });

  // Group team members by team
  const teamMembersByTeam = teamMembers?.reduce((acc, member) => {
    if (!acc[member.team_id]) {
      acc[member.team_id] = [];
    }
    acc[member.team_id].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>) || {};

  // Combined loading state
  const isLoading = isLoadingTeams || isLoadingTeamMembers;
  
  // Check for errors
  const hasErrors = teamsError || teamMembersError;

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Get initials from name
  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      <Tabs defaultValue="all-teams" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all-teams">All Teams</TabsTrigger>
          <TabsTrigger value="my-teams">My Teams</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-teams" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : hasErrors ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-full bg-red-100 text-red-600 p-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Error Loading Teams</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {teamsError ? `Teams error: ${teamsError.message}` : ''}
                  {teamMembersError ? (teamsError ? <br /> : '') + `Team members error: ${teamMembersError.message}` : ''}
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Please make sure the teams and team_members tables exist in your database and that you have the correct permissions.
                </p>
              </CardContent>
            </Card>
          ) : teams && teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center">
                      <span>{team.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {teamMembersByTeam[team.id]?.length || 0} members
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex -space-x-2 overflow-hidden">
                        {teamMembersByTeam[team.id]?.slice(0, 5).map((member) => (
                          <Avatar key={member.user_id} className="border-2 border-background">
                            <AvatarImage src={member.profile?.avatar_url || ''} />
                            <AvatarFallback>{getInitials(member.profile?.full_name)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {(teamMembersByTeam[team.id]?.length || 0) > 5 && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium">
                            +{(teamMembersByTeam[team.id]?.length || 0) - 5}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Team Members</h4>
                        <div className="max-h-40 overflow-y-auto">
                          <Table>
                            <TableBody>
                              {teamMembersByTeam[team.id]?.map((member) => (
                                <TableRow key={member.user_id}>
                                  <TableCell className="py-1">
                                    <div className="flex items-center">
                                      <Avatar className="h-6 w-6 mr-2">
                                        <AvatarImage src={member.profile?.avatar_url || ''} />
                                        <AvatarFallback>{getInitials(member.profile?.full_name)}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">{member.profile?.full_name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-1 text-right">
                                    <Badge className={getRoleBadgeColor(member.role)}>
                                      {member.role}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">
                          <Users className="mr-2 h-4 w-4" />
                          Manage Team
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You haven't created any teams yet. Teams help you organize your projects and collaborate with others.
                </p>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Your First Team
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="my-teams" className="space-y-4 mt-4">
          {/* Similar content as all-teams but filtered to only show teams the user is a member of */}
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <p className="text-muted-foreground">My Teams view will be implemented soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
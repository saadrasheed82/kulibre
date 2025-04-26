import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar, Clock, Filter, Grid, List, Search, SlidersHorizontal } from "lucide-react";

// Define project type
interface Project {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  client_id: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  start_date: string;
  due_date: string;
  client?: string;
  progress?: number;
  priority?: 'Low' | 'Medium' | 'High';
  team_members?: string[];
}

// Status color mapping
const statusColors = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Awaiting Feedback': 'bg-yellow-100 text-yellow-700',
  'Approved': 'bg-green-100 text-green-700',
  'Archived': 'bg-gray-100 text-gray-700',
  'Completed': 'bg-emerald-100 text-emerald-700',
  'On Hold': 'bg-orange-100 text-orange-700',
  'Not Started': 'bg-purple-100 text-purple-700',
};

// Priority color mapping
const priorityColors = {
  'Low': 'bg-blue-100 text-blue-700',
  'Medium': 'bg-yellow-100 text-yellow-700',
  'High': 'bg-red-100 text-red-700',
};

export default function Projects() {
  // View state (grid or list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [teamMemberFilter, setTeamMemberFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  
  // Sort state
  const [sortBy, setSortBy] = useState<string>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Navigation hook
  const navigate = useNavigate(); // Instantiate useNavigate

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Add some mock data for demonstration
      const enhancedData = (data || []).map(project => {
        const mockClientId = 'some_client_id'; // Replace with actual client ID
        // Assign mock data directly without accessing potentially non-existent properties on the original project object
        return {
          ...project,
          client_id: project.client_id || mockClientId,
          client: 'Acme Corp', // Using placeholder client name
          due_date: project.due_date || '2024-06-30',
          progress: Math.floor(Math.random() * 100), // Assigning mock progress
          priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as 'Low' | 'Medium' | 'High', // Assigning mock priority
          team_members: ['Sarah Khan', 'Mike Chen', 'Anna Smith'], // Assigning mock team members
        };
      });
      
      return enhancedData as Project[];
    }
  });

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => 
    [...new Set(projects?.map(p => p.status) || [])], 
    [projects]
  );
  
  const uniqueTypes = useMemo(() => 
    [...new Set(projects?.map(p => p.type) || [])], 
    [projects]
  );
  
  const uniqueTeamMembers = useMemo(() => {
    const allMembers = projects?.flatMap(p => p.team_members || []) || [];
    return [...new Set(allMembers)];
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects
      .filter(project => {
        // Apply status filter
        if (statusFilter.length > 0 && !statusFilter.includes(project.status)) {
          return false;
        }
        
        // Apply type filter
        if (typeFilter.length > 0 && !typeFilter.includes(project.type)) {
          return false;
        }
        
        // Apply team member filter
        if (teamMemberFilter.length > 0 && !project.team_members?.some(member => teamMemberFilter.includes(member))) {
          return false;
        }
        
        // Apply priority filter
        if (priorityFilter.length > 0 && !priorityFilter.includes(project.priority || '')) {
          return false;
        }
        
        // Apply search query
        if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !project.client?.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by selected field
        if (sortBy === 'due_date') {
          const dateA = new Date(a.due_date || '').getTime();
          const dateB = new Date(b.due_date || '').getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        if (sortBy === 'progress') {
          const progressA = a.progress || 0;
          const progressB = b.progress || 0;
          return sortOrder === 'asc' ? progressA - progressB : progressB - progressA;
        }
        
        if (sortBy === 'priority') {
          const priorityValues = { 'Low': 1, 'Medium': 2, 'High': 3 };
          const priorityA = priorityValues[a.priority || 'Low'];
          const priorityB = priorityValues[b.priority || 'Low'];
          return sortOrder === 'asc' ? priorityA - priorityB : priorityB - priorityA;
        }
        
        // Default sort by name
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      });
  }, [projects, statusFilter, typeFilter, teamMemberFilter, priorityFilter, searchQuery, sortBy, sortOrder]);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage your creative projects</p>
          </div>
          <Button onClick={() => navigate('/projects/new')}>+ New Project</Button> 
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                {uniqueStatuses.map(status => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilter.includes(status)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatusFilter([...statusFilter, status]);
                      } else {
                        setStatusFilter(statusFilter.filter(s => s !== status));
                      }
                    }}
                  >
                    {status}
                  </DropdownMenuCheckboxItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Project Type</DropdownMenuLabel>
                {uniqueTypes.map(type => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={typeFilter.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTypeFilter([...typeFilter, type]);
                      } else {
                        setTypeFilter(typeFilter.filter(t => t !== type));
                      }
                    }}
                  >
                    {type}
                  </DropdownMenuCheckboxItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Team Member</DropdownMenuLabel>
                {uniqueTeamMembers.map(member => (
                  <DropdownMenuCheckboxItem
                    key={member}
                    checked={teamMemberFilter.includes(member)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTeamMemberFilter([...teamMemberFilter, member]);
                      } else {
                        setTeamMemberFilter(teamMemberFilter.filter(m => m !== member));
                      }
                    }}
                  >
                    {member}
                  </DropdownMenuCheckboxItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                {['Low', 'Medium', 'High'].map(priority => (
                  <DropdownMenuCheckboxItem
                    key={priority}
                    checked={priorityFilter.includes(priority)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPriorityFilter([...priorityFilter, priority]);
                      } else {
                        setPriorityFilter(priorityFilter.filter(p => p !== priority));
                      }
                    }}
                  >
                    {priority}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                  <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="due_date">Deadline</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="progress">Status</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                <DropdownMenuRadioGroup 
                  value={sortOrder} 
                  onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}
                >
                  <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* View Toggle */}
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Active Filters Display */}
        {(statusFilter.length > 0 || typeFilter.length > 0 || teamMemberFilter.length > 0 || priorityFilter.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {statusFilter.map(status => (
              <Badge key={status} variant="secondary" className="gap-1">
                Status: {status}
                <button 
                  className="ml-1 hover:bg-muted rounded-full"
                  onClick={() => setStatusFilter(statusFilter.filter(s => s !== status))}
                >
                  ×
                </button>
              </Badge>
            ))}
            {typeFilter.map(type => (
              <Badge key={type} variant="secondary" className="gap-1">
                Type: {type}
                <button 
                  className="ml-1 hover:bg-muted rounded-full"
                  onClick={() => setTypeFilter(typeFilter.filter(t => t !== type))}
                >
                  ×
                </button>
              </Badge>
            ))}
            {teamMemberFilter.map(member => (
              <Badge key={member} variant="secondary" className="gap-1">
                Team: {member}
                <button 
                  className="ml-1 hover:bg-muted rounded-full"
                  onClick={() => setTeamMemberFilter(teamMemberFilter.filter(m => m !== member))}
                >
                  ×
                </button>
              </Badge>
            ))}
            {priorityFilter.map(priority => (
              <Badge key={priority} variant="secondary" className="gap-1">
                Priority: {priority}
                <button 
                  className="ml-1 hover:bg-muted rounded-full"
                  onClick={() => setPriorityFilter(priorityFilter.filter(p => p !== priority))}
                >
                  ×
                </button>
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setStatusFilter([]);
                setTypeFilter([]);
                setTeamMemberFilter([]);
                setPriorityFilter([]);
              }}
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Client: {project.client}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Badge>{project.type}</Badge>
                        <Badge 
                          className={statusColors[project.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <Badge 
                        className={priorityColors[project.priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-700'}
                      >
                        {project.priority}
                      </Badge>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {formatDate(project.due_date)}</span>
                      </div>
                      <div className="flex -space-x-2">
                        {(project.team_members || []).slice(0, 3).map((member, i) => (
                          <div 
                            key={i} 
                            className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium border-2 border-background"
                            title={member}
                          >
                            {member.split(' ').map(n => n[0]).join('')}
                          </div>
                        ))}
                        {(project.team_members?.length || 0) > 3 && (
                          <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium border-2 border-background">
                            +{(project.team_members?.length || 0) - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {isLoading && (
              <p className="text-muted-foreground">Loading projects...</p>
            )}

            {!isLoading && !filteredProjects.length && (
              <p className="text-muted-foreground col-span-full text-center py-8">
                No projects found. Try adjusting your filters or create a new project.
              </p>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Project</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Progress</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Team</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{project.name}</td>
                    <td className="px-4 py-3 text-sm">{project.client}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge>{project.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge 
                        className={statusColors[project.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}
                      >
                        {project.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm w-32">
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-2 flex-1" />
                        <span className="text-xs font-medium">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge 
                        className={priorityColors[project.priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-700'}
                      >
                        {project.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(project.due_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex -space-x-2">
                        {(project.team_members || []).slice(0, 3).map((member, i) => (
                          <div 
                            key={i} 
                            className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium border-2 border-background"
                            title={member}
                          >
                            {member.split(' ').map(n => n[0]).join('')}
                          </div>
                        ))}
                        {(project.team_members?.length || 0) > 3 && (
                          <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium border-2 border-background">
                            +{(project.team_members?.length || 0) - 3}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {isLoading && (
              <p className="text-muted-foreground p-4">Loading projects...</p>
            )}

            {!isLoading && !filteredProjects.length && (
              <p className="text-muted-foreground text-center py-8">
                No projects found. Try adjusting your filters or create a new project.
              </p>
            )}
          </div>
        )}
      </div>
  );
}

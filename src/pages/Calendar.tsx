import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { NewEventModal } from "@/components/NewEventModal";
import { EventDetailsModal } from "@/components/EventDetailsModal";
import { CalendarFilters } from "@/components/CalendarFilters";
import { Input } from "@/components/ui/input";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState("month");
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  interface CalendarFiltersType {
    project?: string;
    teamMember?: string;
    eventType?: "task" | "meeting" | "milestone" | "reminder";
  }

  const [filters, setFilters] = useState<CalendarFiltersType>({});

  interface CalendarEvents {
    projects: any[];
    tasks: any[];
  }

  const { data: events } = useQuery<CalendarEvents>({
    // Include both searchQuery and filters in the queryKey to refetch when they change
    queryKey: ['calendar-events', searchQuery, filters],
    queryFn: async () => {
      let projectsQuery = supabase
        .from('projects')
        .select('id, name, due_date, status');

      let tasksQuery = supabase
        .from('tasks')
        .select('id, title, due_date, priority, project_id')
        .not('due_date', 'is', null);

      // Apply search query filter
      if (searchQuery) {
        projectsQuery = projectsQuery.ilike('name', `%${searchQuery}%`);
        // Assuming tasks can also be searched by title
        tasksQuery = tasksQuery.ilike('title', `%${searchQuery}%`);
      }

      // Apply filters
      if (filters.project) {
        projectsQuery = projectsQuery.eq('name', filters.project);
        // Assuming tasks are linked to projects by project_id which might not match project name directly
        // This part might need adjustment based on actual schema (e.g., filtering tasks by project_id if available)
        // For now, filtering tasks based on project name in the filter might not work as intended
        // tasksQuery = tasksQuery.eq('project_id', filters.project); // Revisit this logic based on schema
      }

      if (filters.teamMember) {
        // Assuming 'assigned_members' is an array field in both tables
        projectsQuery = projectsQuery.contains('assigned_members', [filters.teamMember]);
        tasksQuery = tasksQuery.contains('assigned_members', [filters.teamMember]);
      }

      if (filters.eventType) {
        // Assuming 'event_type' column exists and matches the filter values
        // This might need adjustment if event types are stored differently (e.g., in a separate table or column)
        // projectsQuery = projectsQuery.eq('event_type', filters.eventType); // Uncomment/adjust if applicable
        // tasksQuery = tasksQuery.eq('event_type', filters.eventType); // Uncomment/adjust if applicable
      }

      const [projectsResponse, tasksResponse] = await Promise.all([
        projectsQuery,
        tasksQuery
      ]);

      return {
        projects: projectsResponse.data || [],
        tasks: tasksResponse.data || []
      };
    }
  });

  // Filter events based on the selected date *after* fetching/filtering by search/filters
  const selectedDateProjects = events?.projects.filter(project =>
    project.due_date && format(new Date(project.due_date), 'yyyy-MM-dd') === format(date || new Date(), 'yyyy-MM-dd')
  ) || [];

  const selectedDateTasks = events?.tasks.filter(task =>
    task.due_date && format(new Date(task.due_date), 'yyyy-MM-dd') === format(date || new Date(), 'yyyy-MM-dd')
  ) || [];

  return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage your schedule</p>
        </div>

        <ToggleGroup
          type="single"
          defaultValue="month"
          className="mb-4"
          onValueChange={setView}
        >
          <ToggleGroupItem value="month" aria-label="Month">
            Month
          </ToggleGroupItem>
          <ToggleGroupItem value="week" aria-label="Week">
            Week
          </ToggleGroupItem>
          <ToggleGroupItem value="day" aria-label="Day">
            Day
          </ToggleGroupItem>
        </ToggleGroup>

        <Button onClick={() => setNewEventModalOpen(true)}>Add New Event</Button>

        <Input
          type="text"
          placeholder="Search events..."
          className="mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <CalendarFilters onFilterChange={setFilters} />

        <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-6">
          <Card>
            <CardContent className="pt-6">
              {view === "month" && (
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              )}
              {view === "week" && (
                <div>
                  <h2>Week View</h2>
                  <p>Coming Soon</p>
                </div>
              )}
              {view === "day" && (
                <div>
                  <h2>Day View</h2>
                  <p>Coming Soon</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Events for {date ? format(date, 'MMMM d, yyyy') : 'Today'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedDateProjects.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Projects Due</h3>
                  <div className="space-y-2">
                    {selectedDateProjects.map(project => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg hover:cursor-pointer"
                        onClick={() => {
                          setSelectedEvent(project);
                          setEventDetailsModalOpen(true);
                        }}
                      >
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <Badge variant="outline" className="mt-1">
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDateTasks.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Tasks Due</h3>
                  <div className="space-y-2">
                    {selectedDateTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg hover:cursor-pointer"
                        onClick={() => {
                          setSelectedEvent(task);
                          setEventDetailsModalOpen(true);
                        }}
                      >
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <Badge variant="outline" className="mt-1">
                            {task.priority} priority
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDateProjects.length === 0 && selectedDateTasks.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No events scheduled for this day
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <NewEventModal
          open={newEventModalOpen}
          onOpenChange={setNewEventModalOpen}
        />
        <EventDetailsModal
          open={eventDetailsModalOpen}
          onOpenChange={setEventDetailsModalOpen}
          event={selectedEvent}
        />
      </div>
  );
}

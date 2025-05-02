import { useState, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isValid, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { NewEventModal } from "@/components/NewEventModal";
import { EventDetailsModal } from "@/components/EventDetailsModal";
import { CalendarFilters } from "@/components/CalendarFilters";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CalendarPage() {
  console.log("Calendar component rendering...");
  // Add error boundary
  try {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState("month");
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedEvent, setDraggedEvent] = useState<any>(null);
  const [draggedOverDate, setDraggedOverDate] = useState<Date | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  interface CalendarFiltersType {
    teamMember?: string;
    eventType?: "task" | "meeting" | "milestone" | "reminder";
  }

  const [filters, setFilters] = useState<CalendarFiltersType>({});

  interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    event_type: "task" | "meeting" | "milestone" | "reminder";
    start_date: string;
    end_date: string | null;
    all_day: boolean;
    project_id: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    project?: {
      id: string;
      name: string;
    } | null;
    attendees?: {
      user_id: string;
      role: string;
      response: string;
      profile: {
        full_name: string;
      };
    }[];
  }

  interface CalendarEvents {
    events: CalendarEvent[];
    tasks: any[];
  }

  const { data: events, isLoading, error } = useQuery<CalendarEvents, Error, CalendarEvents, [string, string, CalendarFiltersType]>({
    queryKey: ['calendar-events', searchQuery, filters],
    queryFn: async (): Promise<CalendarEvents> => {
      try {
        console.log("Fetching calendar events...");
        // First, check if the calendar_events table exists
        let hasCalendarEventsTable = true;
        try {
          // Use a more reliable method to check if the table exists
          const { data: tableExists, error: tableCheckError } = await supabase
            .from('calendar_events')
            .select('id')
            .limit(1)
            .throwOnError();

          // If there's an error, the table might not exist
          if (tableCheckError) {
            console.log("Calendar events table check error:", tableCheckError);
            if (tableCheckError.message.includes("relation") && tableCheckError.message.includes("does not exist")) {
              console.log("Calendar events table doesn't exist, falling back to tasks");
              hasCalendarEventsTable = false;
            }
          }
        } catch (error) {
          console.error("Error checking calendar_events table:", error);
          hasCalendarEventsTable = false;
        }

        if (!hasCalendarEventsTable) {
          console.log("Using tasks table as fallback");
          try {
            let tasksQuery = supabase
              .from('tasks')
              .select('id, title, due_date, priority, description, project_id, assigned_to')
              .not('due_date', 'is', null);

            // Apply search query filter
            if (searchQuery) {
              tasksQuery = tasksQuery.ilike('title', `%${searchQuery}%`);
            }

            if (filters.teamMember) {
              tasksQuery = tasksQuery.eq('assigned_to', filters.teamMember);
            }

            const tasksResponse = await tasksQuery;

            if (tasksResponse.error) {
              console.error("Error fetching tasks:", tasksResponse.error);
              // Return empty data if there's an error
              const emptyResult: CalendarEvents = {
                events: [],
                tasks: []
              };
              return emptyResult;
            }

            console.log("Tasks fetched successfully:", tasksResponse.data?.length || 0);
            const result: CalendarEvents = {
              events: [],
              tasks: tasksResponse.data || []
            };
            return result;
          } catch (error) {
            console.error("Exception in tasks query:", error);
            // Return empty data if there's an exception
            const emptyResult: CalendarEvents = {
              events: [],
              tasks: []
            };
            return emptyResult;
          }
        }

        // Query calendar events
        let eventsResponse = { data: null, error: null };
        try {
          console.log("Querying calendar events table");
          let eventsQuery = supabase
            .from('calendar_events')
            .select(`
              *,
              project:project_id (id, name),
              creator:created_by (id, full_name)
            `);

          // Apply search query filter
          if (searchQuery) {
            eventsQuery = eventsQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
          }

          // Apply event type filter
          if (filters.eventType) {
            eventsQuery = eventsQuery.eq('event_type', filters.eventType);
          }

          // Apply team member filter
          if (filters.teamMember) {
            try {
              // Get the current user to check if they're filtering for their own events
              const { data: { user } } = await supabase.auth.getUser();

              if (user && filters.teamMember === user.id) {
                // If filtering for current user's events, include events they created
                const { data: attendeeData, error: attendeeError } = await supabase
                  .from('event_attendees')
                  .select('event_id')
                  .eq('user_id', filters.teamMember);

                if (attendeeError) {
                  console.error("Error fetching attendee data:", attendeeError);
                  // Continue with created_by filter only
                  eventsQuery = eventsQuery.eq('created_by', user.id);
                } else if (attendeeData && attendeeData.length > 0) {
                  const eventIds = attendeeData.map(item => item.event_id);
                  // Include events they created OR are attending
                  eventsQuery = eventsQuery.or(`created_by.eq.${user.id},id.in.(${eventIds.join(',')})`);
                } else {
                  // No events they're attending, just show ones they created
                  eventsQuery = eventsQuery.eq('created_by', user.id);
                }
              } else {
                // For other team members, just show events they're attending
                const { data: attendeeData, error: attendeeError } = await supabase
                  .from('event_attendees')
                  .select('event_id')
                  .eq('user_id', filters.teamMember);

                if (attendeeError) {
                  console.error("Error fetching attendee data:", attendeeError);
                  // Return no results if we can't get the attendee data
                  eventsQuery = eventsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
                } else if (attendeeData && attendeeData.length > 0) {
                  const eventIds = attendeeData.map(item => item.event_id);
                  eventsQuery = eventsQuery.in('id', eventIds);
                } else {
                  // If no events found for this team member, return empty array
                  eventsQuery = eventsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
                }
              }
            } catch (error) {
              console.error("Exception in attendee query:", error);
              // Continue with no filter rather than failing completely
            }
          }

          // Execute the events query
          eventsResponse = await eventsQuery;

          if (eventsResponse.error) {
            console.error("Error in events query:", eventsResponse.error);
            throw eventsResponse.error;
          }

          console.log("Events fetched successfully:", eventsResponse.data?.length || 0);
        } catch (error) {
          console.error("Exception in calendar events query:", error);
          // Return empty data if there's an exception
          const emptyResult: CalendarEvents = {
            events: [],
            tasks: []
          };
          return emptyResult;
        }

        // Process the events to add attendees
        let eventsWithAttendees = [];
        try {
          if (!eventsResponse || !eventsResponse.data) {
            console.log("No events data available to process");
            eventsWithAttendees = [];
          } else {
            console.log("Processing events to add attendees");

            // Get all event IDs to fetch attendees in a single query
            const eventIds = eventsResponse.data.map(event => event.id);

            // Fetch all attendees for these events in a single query
            const { data: allAttendees, error: attendeesError } = await supabase
              .from('event_attendees')
              .select(`
                event_id,
                user_id,
                role,
                response,
                profile:profiles!event_attendees_user_id_fkey (id, full_name, avatar_url)
              `)
              .in('event_id', eventIds);

            if (attendeesError) {
              console.error("Error fetching attendees:", attendeesError);
            }

            // Group attendees by event_id for easier lookup
            const attendeesByEvent = {};
            if (allAttendees) {
              allAttendees.forEach(attendee => {
                if (!attendeesByEvent[attendee.event_id]) {
                  attendeesByEvent[attendee.event_id] = [];
                }
                attendeesByEvent[attendee.event_id].push(attendee);
              });
            }

            // Map events with their attendees
            eventsWithAttendees = eventsResponse.data.map(event => {
              // Ensure event_type is one of the allowed values
              const validEventType = (type: string): "task" | "meeting" | "milestone" | "reminder" => {
                return ["task", "meeting", "milestone", "reminder"].includes(type)
                  ? (type as "task" | "meeting" | "milestone" | "reminder")
                  : "task"; // Default to task if invalid
              };

              return {
                ...event,
                event_type: validEventType(event.event_type),
                attendees: attendeesByEvent[event.id] || []
              };
            });
          }
        } catch (error) {
          console.error("Exception processing events with attendees:", error);
          eventsWithAttendees = [];
        }

        // Also fetch tasks as they can be shown on the calendar too
        let tasksData = [];
        try {
          console.log("Fetching tasks for calendar");
          let tasksQuery = supabase
            .from('tasks')
            .select(`
              id,
              title,
              due_date,
              priority,
              description,
              status,
              project:project_id (id, name),
              assignee:assigned_to (id, full_name, avatar_url)
            `)
            .not('due_date', 'is', null);

          if (searchQuery) {
            tasksQuery = tasksQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
          }

          if (filters.teamMember) {
            tasksQuery = tasksQuery.eq('assigned_to', filters.teamMember);
          }

          // If event type filter is set to 'task', include tasks, otherwise exclude them
          if (filters.eventType && filters.eventType !== 'task') {
            // Return no tasks if filtering for non-task event types
            tasksQuery = tasksQuery.eq('id', '00000000-0000-0000-0000-000000000000');
          }

          const tasksResponse = await tasksQuery;

          if (tasksResponse.error) {
            console.error("Error fetching tasks:", tasksResponse.error);
          } else {
            console.log("Tasks fetched successfully:", tasksResponse.data?.length || 0);

            // Transform tasks to have a consistent format with calendar events
            tasksData = (tasksResponse.data || []).map(task => ({
              ...task,
              event_type: 'task' as const,
              start_date: task.due_date,
              all_day: true, // Tasks are typically all-day events
              project_id: task.project?.id
            }));
          }
        } catch (error) {
          console.error("Exception fetching tasks:", error);
        }

        console.log("Returning calendar data:", {
          events: eventsWithAttendees.length,
          tasks: tasksData.length
        });

        const result: CalendarEvents = {
          events: eventsWithAttendees,
          tasks: tasksData
        };
        return result;
      } catch (error: any) {
        console.error("Error fetching calendar events:", error);
        // Don't show toast on initial load to prevent UI disruption
        // Only show it if there's a specific search or filter active
        if (searchQuery || Object.keys(filters).length > 0) {
          toast({
            title: "Error",
            description: "Failed to load calendar events. Please try again.",
            variant: "destructive",
          });
        }

        // Ensure we return the correct type
        const emptyResult: CalendarEvents = {
          events: [],
          tasks: []
        };
        return emptyResult;
      }
    }
  });

  // Function to format date for comparison
  const formatDateForComparison = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return isValid(date) ? format(date, 'yyyy-MM-dd') : null;
    } catch (error) {
      console.error("Invalid date:", dateString);
      return null;
    }
  };

  // Filter events based on the selected date
  console.log("Events data:", events);

  const selectedDateEvents = (() => {
    try {
      if (!events || !events.events) {
        console.log("No events data available");
        return [];
      }

      console.log("Filtering events for date:", date);
      return events.events.filter(event => {
        try {
          if (!event || !event.start_date) {
            console.log("Invalid event data:", event);
            return false;
          }

          const eventDate = formatDateForComparison(event.start_date);
          const selectedDate = formatDateForComparison(date || new Date());
          console.log(`Event ${event.id}: ${eventDate} vs ${selectedDate}`);
          return eventDate === selectedDate;
        } catch (error) {
          console.error("Error filtering event:", error);
          return false;
        }
      });
    } catch (error) {
      console.error("Error in selectedDateEvents:", error);
      return [];
    }
  })();

  // Filter tasks based on the selected date
  const selectedDateTasks = (() => {
    try {
      if (!events || !events.tasks) {
        console.log("No tasks data available");
        return [];
      }

      console.log("Filtering tasks for date:", date);
      return events.tasks.filter(task => {
        try {
          if (!task || !task.due_date) {
            console.log("Invalid task data:", task);
            return false;
          }

          const taskDate = formatDateForComparison(task.due_date);
          const selectedDate = formatDateForComparison(date || new Date());
          console.log(`Task ${task.id}: ${taskDate} vs ${selectedDate}`);
          return taskDate === selectedDate;
        } catch (error) {
          console.error("Error filtering task:", error);
          return false;
        }
      });
    } catch (error) {
      console.error("Error in selectedDateTasks:", error);
      return [];
    }
  })();

  // Function to get event type badge color
  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      task: "bg-blue-100 text-blue-800",
      meeting: "bg-purple-100 text-purple-800",
      milestone: "bg-green-100 text-green-800",
      reminder: "bg-amber-100 text-amber-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // Function to get task priority badge color
  const getTaskPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800",
      medium: "bg-amber-100 text-amber-800",
      low: "bg-green-100 text-green-800"
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  // Function to handle event creation
  const handleEventCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    setNewEventModalOpen(false);
    toast({
      title: "Event Created",
      description: "Your event has been successfully created.",
    });
  };

  // Function to handle event update
  const handleEventUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    setEventDetailsModalOpen(false);

    // If we're editing an event, open the NewEventModal with the selected event data
    if (selectedEvent) {
      setIsEditingEvent(true);
      setNewEventModalOpen(true);
    }
  };

  // Function to handle when an event edit is completed
  const handleEventEditCompleted = () => {
    setIsEditingEvent(false);
    setNewEventModalOpen(false);
    setSelectedEvent(null);

    // Refresh the calendar data
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });

    toast({
      title: "Event Updated",
      description: "Your event has been successfully updated.",
    });
  };

  // Drag and drop handlers
  const handleDragStart = (event: any) => {
    setDraggedEvent(event);
  };

  const handleDragOver = (day: Date) => {
    setDraggedOverDate(day);
  };

  const handleDrop = () => {
    if (draggedEvent && draggedOverDate) {
      setSelectedEvent(draggedEvent);
      setRescheduleDialogOpen(true);
    }
    // Reset drag state
    setDraggedEvent(null);
    setDraggedOverDate(null);
  };

  // Function to reschedule an event
  const handleRescheduleEvent = async () => {
    if (!draggedEvent || !draggedOverDate) return;

    setIsRescheduling(true);

    try {
      // Determine if this is a task or calendar event
      if (draggedEvent.event_type === 'task' && !draggedEvent.all_day) {
        // Update task due date
        const { error } = await supabase
          .from('tasks')
          .update({
            due_date: draggedOverDate.toISOString(),
          })
          .eq('id', draggedEvent.id);

        if (error) throw error;
      } else {
        // Calculate the difference in days between original and new date
        const originalDate = new Date(draggedEvent.start_date);
        const daysDifference = Math.round(
          (draggedOverDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Update calendar event dates
        let updateData: any = {
          start_date: draggedOverDate.toISOString(),
          updated_at: new Date().toISOString(),
        };

        // If there's an end date, shift it by the same number of days
        if (draggedEvent.end_date) {
          const originalEndDate = new Date(draggedEvent.end_date);
          const newEndDate = addDays(originalEndDate, daysDifference);
          updateData.end_date = newEndDate.toISOString();
        }

        const { error } = await supabase
          .from('calendar_events')
          .update(updateData)
          .eq('id', draggedEvent.id);

        if (error) throw error;
      }

      // Refresh calendar data
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });

      toast({
        title: "Event rescheduled",
        description: "Your event has been successfully rescheduled.",
      });
    } catch (error: any) {
      console.error("Error rescheduling event:", error);
      toast({
        title: "Error rescheduling event",
        description: error.message || "Failed to reschedule event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRescheduling(false);
      setRescheduleDialogOpen(false);
    }
  };

  return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage your schedule</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
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
        </div>

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
                <div
                  ref={calendarRef}
                  onDragOver={(e) => {
                    e.preventDefault();
                    // Find the day element that's being dragged over
                    if (e.target instanceof HTMLElement) {
                      const dayElement = e.target.closest('[data-day]');
                      if (dayElement && dayElement.getAttribute('data-date')) {
                        const dateStr = dayElement.getAttribute('data-date');
                        if (dateStr) {
                          const date = new Date(dateStr);
                          handleDragOver(date);
                        }
                      }
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop();
                  }}
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    modifiers={{
                      eventDay: (day) => {
                        // Check if this day has any events
                        const dayStr = format(day, 'yyyy-MM-dd');

                        // Check events
                        const hasEvents = events?.events.some(event => {
                          if (!event.start_date) return false;
                          return format(new Date(event.start_date), 'yyyy-MM-dd') === dayStr;
                        });

                        // Check tasks
                        const hasTasks = events?.tasks.some(task => {
                          if (!task.due_date) return false;
                          return format(new Date(task.due_date), 'yyyy-MM-dd') === dayStr;
                        });

                        return hasEvents || hasTasks;
                      },
                      dragOver: (day) => {
                        if (!draggedOverDate) return false;
                        return format(day, 'yyyy-MM-dd') === format(draggedOverDate, 'yyyy-MM-dd');
                      }
                    }}
                    modifiersClassNames={{
                      eventDay: "bg-primary/10 font-bold",
                      dragOver: "bg-secondary/30 border-2 border-secondary"
                    }}
                    components={{
                      Day: ({ date: dayDate, ...props }) => {
                        // Add data-date attribute to each day for drag and drop
                        return (
                          <div
                            {...props}
                            data-day
                            data-date={dayDate.toISOString()}
                          />
                        );
                      }
                    }}
                  />
                </div>
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
              {isLoading ? (
                <p className="text-center py-4">Loading events...</p>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-2">Error loading calendar data</p>
                  <p className="text-muted-foreground">There was a problem loading your calendar. Please try again later.</p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mt-4"
                  >
                    Refresh Page
                  </Button>
                </div>
              ) : (
                <>
                  {selectedDateEvents.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Events</h3>
                      <div className="space-y-2">
                        {selectedDateEvents.map(event => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg hover:cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => {
                              setSelectedEvent(event);
                              setEventDetailsModalOpen(true);
                            }}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', event.id);
                              handleDragStart(event);
                            }}
                          >
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge className={getEventTypeColor(event.event_type)}>
                                  {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                                </Badge>
                                {event.project && (
                                  <Badge variant="outline">
                                    {event.project.name}
                                  </Badge>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                  {event.description}
                                </p>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {event.all_day ? 'All day' : (
                                event.start_date && format(new Date(event.start_date), 'h:mm a')
                              )}
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
                            className="flex items-center justify-between p-3 bg-muted rounded-lg hover:cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => {
                              setSelectedEvent({
                                ...task,
                                event_type: 'task',
                                start_date: task.due_date
                              });
                              setEventDetailsModalOpen(true);
                            }}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', task.id);
                              handleDragStart({
                                ...task,
                                event_type: 'task',
                                start_date: task.due_date
                              });
                            }}
                          >
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <Badge className={`${getTaskPriorityColor(task.priority)} mt-1`} variant="outline">
                                {task.priority} priority
                              </Badge>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDateEvents.length === 0 && selectedDateTasks.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No events scheduled for this day
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <NewEventModal
          open={newEventModalOpen}
          onOpenChange={setNewEventModalOpen}
          onEventCreated={handleEventCreated}
          onEventUpdated={handleEventEditCompleted}
          event={selectedEvent}
          isEditing={isEditingEvent}
        />
        <EventDetailsModal
          open={eventDetailsModalOpen}
          onOpenChange={setEventDetailsModalOpen}
          event={selectedEvent}
          onEventUpdated={handleEventUpdated}
        />

        {/* Reschedule Confirmation Dialog */}
        <AlertDialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reschedule Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reschedule "{draggedEvent?.title}" to {draggedOverDate ? format(draggedOverDate, 'MMMM d, yyyy') : ''}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRescheduleEvent}
                disabled={isRescheduling}
              >
                {isRescheduling ? "Rescheduling..." : "Reschedule"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
  } catch (error) {
    console.error("Calendar component error:", error);
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Calendar Error</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-600">There was an error loading the calendar component.</p>
          <p className="text-sm text-red-500 mt-2">
            Error details: {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Reload Page
        </button>
      </div>
    );
  }
}

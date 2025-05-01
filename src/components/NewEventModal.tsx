import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useQuery } from "@tanstack/react-query";

const FormSchema = z.object({
  title: z.string().min(2, {
    message: "Event title must be at least 2 characters.",
  }),
  eventType: z.enum(["task", "meeting", "milestone", "reminder"], {
    required_error: "Please select an event type.",
  }),
  projectId: z.string().optional(),
  startDate: z.date({
    required_error: "Please select a start date.",
  }),
  startTime: z.string().optional(),
  endDate: z.date().optional(),
  endTime: z.string().optional(),
  allDay: z.boolean().default(false),
  assignedMembers: z.array(z.string()).default([]),
  description: z.string().optional(),
})

interface NewEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: () => void;
}

export function NewEventModal({ open, onOpenChange, onEventCreated }: NewEventModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch projects for the dropdown
  const { data: projects } = useQuery({
    queryKey: ['projects-for-calendar'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
    },
    enabled: open, // Only fetch when modal is open
  });

  // Fetch team members for the dropdown
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members-for-calendar'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .order('full_name');
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching team members:", error);
        return [];
      }
    },
    enabled: open, // Only fetch when modal is open
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      eventType: "task",
      projectId: "",
      startDate: new Date(),
      startTime: "09:00",
      endDate: undefined,
      endTime: "10:00",
      allDay: false,
      assignedMembers: [],
      description: "",
    },
  });

  const watchAllDay = form.watch("allDay");

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to create an event");
      }

      // Format start date with time if not all day
      let startDateTime = new Date(values.startDate);
      if (!values.allDay && values.startTime) {
        const [hours, minutes] = values.startTime.split(':').map(Number);
        startDateTime.setHours(hours, minutes);
      }

      // Format end date with time if provided and not all day
      let endDateTime = values.endDate ? new Date(values.endDate) : undefined;
      if (endDateTime && !values.allDay && values.endTime) {
        const [hours, minutes] = values.endTime.split(':').map(Number);
        endDateTime.setHours(hours, minutes);
      }

      // Insert event
      const { data: eventData, error: eventError } = await supabase
        .from('calendar_events')
        .insert([{
          title: values.title,
          description: values.description,
          event_type: values.eventType,
          start_date: startDateTime.toISOString(),
          end_date: endDateTime ? endDateTime.toISOString() : null,
          all_day: values.allDay,
          project_id: values.projectId || null,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select();

      if (eventError) throw eventError;

      // Add attendees if any are selected
      if (values.assignedMembers.length > 0 && eventData && eventData[0]) {
        const attendeesData = values.assignedMembers.map(memberId => ({
          event_id: eventData[0].id,
          user_id: memberId,
          role: 'attendee',
          response: 'pending'
        }));

        const { error: attendeesError } = await supabase
          .from('event_attendees')
          .insert(attendeesData);

        if (attendeesError) {
          console.error("Error adding attendees:", attendeesError);
        }
      }

      toast({
        title: "Event created",
        description: "Your event has been added to the calendar.",
      });

      // Reset form and close modal
      form.reset();
      onOpenChange(false);
      
      // Call callback if provided
      if (onEventCreated) {
        onEventCreated();
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Error creating event",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Add New Event</AlertDialogTitle>
          <AlertDialogDescription>
            Create a new event to add to your calendar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="task">Task Deadline</SelectItem>
                      <SelectItem value="meeting">Client Meeting</SelectItem>
                      <SelectItem value="milestone">Project Milestone</SelectItem>
                      <SelectItem value="reminder">Internal Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Project</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {projects?.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>All-day event</FormLabel>
                    <FormDescription>
                      This event will take the entire day
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!watchAllDay && (
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 opacity-50" />
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => 
                            date < form.getValues("startDate")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!watchAllDay && (
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 opacity-50" />
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <FormField
              control={form.control}
              name="assignedMembers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attendees</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const currentValues = field.value || [];
                      if (currentValues.includes(value)) {
                        field.onChange(currentValues.filter(v => v !== value));
                      } else {
                        field.onChange([...currentValues, value]);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          field.value.length > 0 
                            ? `${field.value.length} attendee(s) selected` 
                            : "Select attendees"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teamMembers?.map(member => (
                        <SelectItem 
                          key={member.id} 
                          value={member.id}
                          className={cn(
                            field.value.includes(member.id) && "bg-primary/10"
                          )}
                        >
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selected: {field.value.length > 0 
                      ? teamMembers
                          ?.filter(m => field.value.includes(m.id))
                          .map(m => m.full_name)
                          .join(", ")
                      : "None"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description/Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Event description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any relevant details about the event.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

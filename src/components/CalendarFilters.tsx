import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

export interface CalendarFiltersType {
  project?: string;
  teamMember?: string;
  eventType?: "task" | "meeting" | "milestone" | "reminder";
}

const FormSchema = z.object({
  project: z.string().optional(),
  teamMember: z.string().optional(),
  eventType: z.enum(["task", "meeting", "milestone", "reminder"]).optional(),
})

interface CalendarFiltersProps {
  onFilterChange: (filters: CalendarFiltersType) => void;
}

export function CalendarFilters({ onFilterChange }: CalendarFiltersProps) {
  const form = useForm<CalendarFiltersType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      project: "",
      teamMember: "",
      eventType: undefined,
    },
  })

  function onSubmit(values: CalendarFiltersType) {
    onFilterChange(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="project"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <FormControl>
                <Input placeholder="Project" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teamMember"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Member</FormLabel>
              <FormControl>
                <Input placeholder="Team Member" {...field} />
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
      </form>
    </Form>
  )
}


import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { data: events } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const [projectsResponse, tasksResponse] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, due_date, status')
          .not('due_date', 'is', null),
        supabase
          .from('tasks')
          .select('id, title, due_date, priority, project_id')
          .not('due_date', 'is', null)
      ]);

      return {
        projects: projectsResponse.data || [],
        tasks: tasksResponse.data || []
      };
    }
  });

  const selectedDateProjects = events?.projects.filter(project => 
    project.due_date && format(new Date(project.due_date), 'yyyy-MM-dd') === format(date || new Date(), 'yyyy-MM-dd')
  ) || [];

  const selectedDateTasks = events?.tasks.filter(task => 
    task.due_date && format(new Date(task.due_date), 'yyyy-MM-dd') === format(date || new Date(), 'yyyy-MM-dd')
  ) || [];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage your schedule</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-6">
          <Card>
            <CardContent className="pt-6">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
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
                      <div key={project.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
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
                      <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
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
      </div>
    </Layout>
  );
}

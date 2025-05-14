import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CalendarSimple() {
  const [date, setDate] = useState<Date | undefined>(new Date());
<<<<<<< HEAD

=======
  
>>>>>>> c443c66e1b864d29687db63a9c0dc116e92db326
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground mt-1">View and manage your schedule</p>
      </div>
<<<<<<< HEAD

=======
      
>>>>>>> c443c66e1b864d29687db63a9c0dc116e92db326
      <Card>
        <CardHeader>
          <CardTitle>Simple Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
<<<<<<< HEAD
            className="rounded-md border calendar-fix"
            components={{
              Day: ({ date: dayDate, ...props }) => {
                return (
                  <div
                    {...props}
                    data-day
                  >
                    {dayDate.getDate()}
                  </div>
                );
              }
            }}
          />

=======
            className="rounded-md border"
          />
          
>>>>>>> c443c66e1b864d29687db63a9c0dc116e92db326
          <div className="mt-4">
            <p>Selected date: {date ? date.toDateString() : 'None'}</p>
          </div>
        </CardContent>
      </Card>
<<<<<<< HEAD

=======
      
>>>>>>> c443c66e1b864d29687db63a9c0dc116e92db326
      <Button onClick={() => window.location.reload()}>Refresh Page</Button>
    </div>
  );
}
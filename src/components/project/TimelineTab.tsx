import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Filter } from "lucide-react";

interface TimelineItem {
  id: string;
  task: string;
  start: string;
  end: string;
  progress: number;
  phase: string;
  assignee: string;
  dependencies?: string[];
}

export function TimelineTab() {
  const [timelineItems] = useState<TimelineItem[]>([
    {
      id: '1',
      task: 'Project Kickoff',
      start: '2024-01-15',
      end: '2024-01-20',
      progress: 100,
      phase: 'Planning',
      assignee: 'Sarah Khan'
    },
    {
      id: '2',
      task: 'Brand Strategy Development',
      start: '2024-01-21',
      end: '2024-02-10',
      progress: 80,
      phase: 'Strategy',
      assignee: 'Mike Chen',
      dependencies: ['1']
    },
    {
      id: '3',
      task: 'Visual Identity Design',
      start: '2024-02-11',
      end: '2024-03-10',
      progress: 40,
      phase: 'Design',
      assignee: 'Anna Smith',
      dependencies: ['2']
    },
    {
      id: '4',
      task: 'Client Review & Feedback',
      start: '2024-03-11',
      end: '2024-03-20',
      progress: 0,
      phase: 'Review',
      assignee: 'John Doe',
      dependencies: ['3']
    },
    {
      id: '5',
      task: 'Final Delivery',
      start: '2024-03-21',
      end: '2024-03-30',
      progress: 0,
      phase: 'Delivery',
      assignee: 'Sarah Khan',
      dependencies: ['4']
    }
  ]);

  // Calculate timeline dimensions
  const startDate = new Date('2024-01-15');
  const endDate = new Date('2024-03-30');
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getBarPosition = (item: TimelineItem) => {
    const itemStart = new Date(item.start);
    const itemEnd = new Date(item.end);
    const left = ((itemStart.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;
    const width = ((itemEnd.getTime() - itemStart.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const phaseColors: Record<string, string> = {
    'Planning': 'bg-blue-500',
    'Strategy': 'bg-purple-500',
    'Design': 'bg-pink-500',
    'Review': 'bg-yellow-500',
    'Delivery': 'bg-green-500'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="strategy">Strategy</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Members</SelectItem>
              <SelectItem value="sarah">Sarah Khan</SelectItem>
              <SelectItem value="mike">Mike Chen</SelectItem>
              <SelectItem value="anna">Anna Smith</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Timeline
        </Button>
      </div>

      <Card className="p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline Header */}
          <div className="flex items-center mb-6">
            <div className="w-1/4 pr-4">
              <h3 className="font-medium">Task</h3>
            </div>
            <div className="w-3/4 relative">
              <div className="flex justify-between text-sm text-muted-foreground absolute -top-6 w-full">
                <span>Jan 2024</span>
                <span>Feb 2024</span>
                <span>Mar 2024</span>
              </div>
              <div className="h-8 border-b flex">
                {Array.from({ length: totalDays }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 border-l h-full"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Items */}
          <div className="space-y-4">
            {timelineItems.map(item => (
              <div key={item.id} className="flex items-center">
                <div className="w-1/4 pr-4">
                  <div className="font-medium">{item.task}</div>
                  <div className="text-sm text-muted-foreground">{item.assignee}</div>
                </div>
                <div className="w-3/4 h-8 relative">
                  <div
                    className={`absolute h-6 rounded-full ${phaseColors[item.phase]} opacity-90`}
                    style={getBarPosition(item)}
                  >
                    <div
                      className="h-full bg-black bg-opacity-20 rounded-l-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
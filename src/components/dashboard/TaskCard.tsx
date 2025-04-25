
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  project: string;
  dueTime: string;
  priority: "high" | "medium" | "low";
  completed?: boolean;
  onClick?: () => void;
}

export function TaskCard({ title, project, dueTime, priority, completed = false, onClick }: TaskCardProps) {
  const priorityColors = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  return (
    <div 
      className={cn(
        "border rounded-lg p-4 flex items-start justify-between cursor-pointer transition-all hover:shadow-md",
        completed ? "bg-gray-50" : "bg-white"
      )}
      onClick={onClick}
    >
      <div className="flex gap-3 items-start">
        <div 
          className={cn(
            "h-6 w-6 rounded-full border-2 flex items-center justify-center",
            completed
              ? "border-green-500 bg-green-500 text-white"
              : "border-gray-300"
          )}
        >
          {completed && <CheckCircle2 className="h-4 w-4" />}
        </div>
        <div>
          <h4 className={cn(
            "text-base font-medium",
            completed && "text-muted-foreground line-through"
          )}>
            {title}
          </h4>
          <p className="text-sm text-muted-foreground">{project}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span 
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            priorityColors[priority]
          )}
        >
          {priority}
        </span>
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          <span>{dueTime}</span>
        </div>
      </div>
    </div>
  );
}

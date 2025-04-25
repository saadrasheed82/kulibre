
import { Calendar, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ProjectCardProps {
  title: string;
  client: string;
  progress: number;
  dueDate: string;
  type: string;
  status: "on-track" | "at-risk" | "delayed" | "completed";
  teamMembers: Array<{ initials: string; color?: string }>;
}

export function ProjectCard({
  title,
  client,
  progress,
  dueDate,
  type,
  status,
  teamMembers
}: ProjectCardProps) {
  const statusColors = {
    "on-track": "bg-green-100 text-green-700",
    "at-risk": "bg-yellow-100 text-yellow-700",
    "delayed": "bg-red-100 text-red-700",
    "completed": "bg-blue-100 text-blue-700",
  };

  const statusLabels = {
    "on-track": "On Track",
    "at-risk": "At Risk",
    "delayed": "Delayed",
    "completed": "Completed",
  };

  return (
    <Link to="/projects/123" className="block">
      <div className="border rounded-xl p-5 bg-white card-hover">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-medium text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{client}</p>
          </div>
          <span 
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              statusColors[status]
            )}
          >
            {statusLabels[status]}
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {teamMembers.slice(0, 3).map((member, i) => (
              <div
                key={i}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium",
                  member.color || "bg-creatively-purple"
                )}
              >
                {member.initials}
              </div>
            ))}
            {teamMembers.length > 3 && (
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                +{teamMembers.length - 3}
              </div>
            )}
          </div>
          
          <div className="flex gap-3 text-muted-foreground">
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              <span>{dueDate}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              <span>{type}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

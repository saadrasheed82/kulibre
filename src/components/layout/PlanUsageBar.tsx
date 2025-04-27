import { Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PlanUsageBarProps {
  className?: string;
  position?: "top" | "bottom";
}

export function PlanUsageBar({ className, position = "top" }: PlanUsageBarProps) {
  const navigate = useNavigate();

  const handleUpgradePlan = () => {
    navigate('/select-plan');
  };

  return (
    <div 
      className={cn(
        "fixed z-50 left-1/2 transform -translate-x-1/2 w-auto max-w-md bg-white/90 backdrop-blur-md border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 cursor-pointer transition-all hover:bg-white hover:shadow-xl",
        position === "top" ? "top-4" : "bottom-6",
        className
      )}
      onClick={handleUpgradePlan}
    >
      <div className="flex items-center gap-2">
        <div className="bg-creatively-purple rounded-full p-1.5">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium">Free Plan</span>
      </div>
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">2/5 projects used</span>
          <span className="text-xs font-medium ml-2">40%</span>
        </div>
        <div className="w-36 h-2 bg-creatively-purple/20 rounded-full mt-1">
          <div className="h-full bg-creatively-purple rounded-full w-2/5"></div>
        </div>
      </div>
      <span className="text-xs bg-creatively-purple text-white px-3 py-1 rounded-full font-medium">Upgrade</span>
    </div>
  );
}
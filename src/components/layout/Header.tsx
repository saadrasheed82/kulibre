
import { Bell, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="border-b py-3 px-6 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3 md:w-1/3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 w-full rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button size="sm" variant="default" className="gap-1">
          <Plus className="h-4 w-4" /> 
          <span className="hidden md:inline">New Project</span>
        </Button>
        <div className="relative">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer" />
          <span className="absolute -top-1 -right-1 bg-creatively-purple text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </div>
        <div className="h-9 w-9 rounded-full bg-creatively-purple flex items-center justify-center text-white font-medium">
          JS
        </div>
      </div>
    </header>
  );
}
